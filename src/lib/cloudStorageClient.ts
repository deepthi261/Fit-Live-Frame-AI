import { NEURAL_CONFIG } from '../config';

/**
 * NEURAL PERSISTENCE SYSTEM V3.0
 * Handles dual-sync (GCS + Sheets) and Daily App Persistence.
 */

export interface SessionData {
    reps: number;
    time: string;
    precision: number;
    calories: number;
    exercise: string;
    diet: string;
    gender: string;
    sessionNum: number;
    timestamp: string;
    screenshot?: string;
}

class NeuralPersistenceClient {
    private bucketName: string;

    constructor() {
        this.bucketName = localStorage.getItem('gcs_bucket_name') || 'fit-live-frame-ai';
    }

    async syncSession(data: SessionData, mediaBlob?: Blob | File, onProgress?: (progress: number) => void): Promise<{ gcs: boolean, sheets: boolean }> {
        // 1. PERSIST TO SAME APP (Local Vault)
        this.saveToLocalVault(data);

        const status = { gcs: false, sheets: false };
        const gcsSyncUrl = localStorage.getItem('gcs_sync_url') || NEURAL_CONFIG.GCS_SYNC_URL;
        const date = new Date().toISOString().split('T')[0];
        const timeKey = Date.now();

        // 2. STORE TO GCS (JSON Archive) - AWAITED FOR IMMEDIATE STATS CONFIRMATION
        try {
            const gcsRes = await fetch(gcsSyncUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket: this.bucketName || NEURAL_CONFIG.GCS_BUCKET_NAME,
                    path: `archives/${date}/Session-${data.sessionNum || 0}_${timeKey}.json`,
                    payload: data
                }),
            });
            status.gcs = gcsRes.ok;
        } catch (e) { console.error("GCS Sync Fail", e); }

        // 3. STORE TO SHEETS (Neural Bridge Proxy) - ELIMINATES CORB/CORS ISSUES
        const sheetsUrl = localStorage.getItem('neural_sheet_url') || NEURAL_CONFIG.NEURAL_SHEET_URL;
        if (sheetsUrl) {
            try {
                const sheetsRes = await fetch(gcsSyncUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bucket: this.bucketName || NEURAL_CONFIG.GCS_BUCKET_NAME,
                        path: "sheets_buffer", // Needed for proxy schema
                        action: 'syncSheets',
                        sheetsUrl: sheetsUrl,
                        payload: { ...data, type: "summary" }
                    }),
                });
                status.sheets = sheetsRes.ok;
                if (status.sheets) console.log("Neural Summary dispatched to Sheets via Proxy");
            } catch (e) { console.error("Sheets Proxy Fail", e); }
        }

        // 4. BACKGROUND MEDIA SYNC (Infinity Protocol with Pulse Progress)
        if (mediaBlob && gcsSyncUrl) {
            this.handleMediaArchival(mediaBlob, data.sessionNum || 0, date, timeKey, gcsSyncUrl, onProgress);
        }

        return status;
    }

    private async handleMediaArchival(blob: Blob | File, sessionNum: number, date: string, timeKey: number, gcsSyncUrl: string, onProgress?: (p: number) => void) {
        try {
            let ext = 'mp4';
            if (blob.type.includes('webm')) ext = 'webm';
            if (blob.type.includes('quicktime')) ext = 'mov';
            const mediaPath = `archives/${date}/Session-${sessionNum}_${timeKey}.${ext}`;

            // Negotiate Neural Tunnel (Resumable Session)
            const signRes = await fetch(gcsSyncUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket: this.bucketName || NEURAL_CONFIG.GCS_BUCKET_NAME,
                    path: mediaPath,
                    action: 'getSignedUrl',
                    contentType: blob.type
                }),
            });

            if (!signRes.ok) throw new Error("Neural Pulse: Tunnel negotiation failed");
            const { url } = await signRes.json();

            // ⚡ Hyper-Sync via XMLHttpRequest (V4 Resumable Tunnel with Auto-Resume)
            const initiateSession = () => {
                return new Promise<string>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', url);
                    xhr.setRequestHeader('x-goog-resumable', 'start');
                    xhr.setRequestHeader('Content-Type', blob.type);
                    xhr.onload = () => {
                        if (xhr.status === 200 || xhr.status === 201) {
                            const loc = xhr.getResponseHeader('Location');
                            loc ? resolve(loc) : reject(new Error("Neural Pulse: Session Location Lost"));
                        } else reject(new Error(`Session Initialization Failed: ${xhr.status}`));
                    };
                    xhr.onerror = () => reject(new Error("Neural Tunnel Initialization Collapse"));
                    xhr.send();
                });
            };

            const uploadFromOffset = (sessionUrl: string, offset: number): Promise<boolean> => {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('PUT', sessionUrl);

                    // Slice the blob for resuming
                    const chunk = offset > 0 ? blob.slice(offset) : blob;
                    const totalSize = blob.size;

                    // Content-Range: bytes START-END/TOTAL
                    xhr.setRequestHeader('Content-Range', `bytes ${offset}-${totalSize - 1}/${totalSize}`);

                    if (xhr.upload && onProgress) {
                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                // Calculate global percent: (bytesAlreadyStored + bytesInCurrentStream) / totalSize
                                const globalLoaded = offset + e.loaded;
                                const totalPercent = Math.round((globalLoaded / totalSize) * 100);
                                onProgress(totalPercent);
                            }
                        };
                    }

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            console.log(`[Neural Media] Vault Secured: ${mediaPath}`);
                            if (onProgress) onProgress(100);
                            resolve(true);
                        } else if (xhr.status === 308) {
                            // Resume logic: GCS returns current range
                            const range = xhr.getResponseHeader('Range');
                            if (range) {
                                const lastByte = parseInt(range.split('-')[1]);
                                resolve(uploadFromOffset(sessionUrl, lastByte + 1));
                            } else {
                                resolve(uploadFromOffset(sessionUrl, offset)); // Retry same offset
                            }
                        } else {
                            reject(new Error(`Vault Reject: ${xhr.status}`));
                        }
                    };

                    xhr.onerror = async () => {
                        console.warn("[Neural Tunnel] Interruption detected. Handshaking for resume...");
                        // Query GCS for current progress
                        setTimeout(() => {
                            const queryXhr = new XMLHttpRequest();
                            queryXhr.open('PUT', sessionUrl);
                            queryXhr.setRequestHeader('Content-Range', `bytes */${totalSize}`);
                            queryXhr.onload = () => {
                                const range = queryXhr.getResponseHeader('Range');
                                if (range) {
                                    const lastByte = parseInt(range.split('-')[1]);
                                    resolve(uploadFromOffset(sessionUrl, lastByte + 1));
                                } else {
                                    resolve(uploadFromOffset(sessionUrl, 0)); // Restart if no range
                                }
                            };
                            queryXhr.onerror = () => reject(new Error("Neural Tunnel Collapse"));
                            queryXhr.send();
                        }, 3000); // Wait for network to stabilize
                    };
                    xhr.send(chunk);
                });
            };

            const finalUploadUrl = await initiateSession();
            return await uploadFromOffset(finalUploadUrl, 0);

        } catch (e) {
            console.error("Neural Media Archival Failed", e);
            if (onProgress) onProgress(-1); // Sync Alert State
        }
    }

    async logEntry(data: any) {
        const sheetsUrl = localStorage.getItem('neural_sheet_url') || NEURAL_CONFIG.NEURAL_SHEET_URL;
        if (!sheetsUrl) return;

        try {
            await fetch(sheetsUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    type: "entry",
                    timestamp: data.timestamp,
                    sessionNum: data.sessionNum,
                    exercise: data.exercise
                }),
            });
            console.log("Neural Entry pulse sent to Sheets");
        } catch (e) { console.error("Entry Log Fail", e); }
    }

    private saveToLocalVault(data: SessionData) {
        // Log individual session
        const historyRaw = localStorage.getItem('neural_history') || '[]';
        const history = JSON.parse(historyRaw);
        history.push({ ...data, id: Date.now() });
        localStorage.setItem('neural_history', JSON.stringify(history.slice(-100)));

        // 🧬 UPDATE FIELDS OF SAME APP (Daily Aggregates)
        const today = new Date().toLocaleDateString();
        const dailyStatsRaw = localStorage.getItem(`daily_stats_${today}`) || JSON.stringify({ reps: 0, kcal: 0, sessions: 0 });
        const dailyStats = JSON.parse(dailyStatsRaw);

        dailyStats.reps += data.reps;
        dailyStats.kcal += data.calories;
        dailyStats.sessions += 1;

        localStorage.setItem(`daily_stats_${today}`, JSON.stringify(dailyStats));

        // Update global counters for HUD direct access
        localStorage.setItem('total_reps_today', dailyStats.reps.toString());
        localStorage.setItem('total_kcal_today', dailyStats.kcal.toString());
    }

    getDailyStats() {
        const today = new Date().toLocaleDateString();
        const stats = localStorage.getItem(`daily_stats_${today}`);
        return stats ? JSON.parse(stats) : { reps: 0, kcal: 0, sessions: 0 };
    }

    getWeeklyHistory() {
        const historyRaw = localStorage.getItem('neural_history') || '[]';
        return JSON.parse(historyRaw).reverse();
    }

    getSeriesData() {
        const history = JSON.parse(localStorage.getItem('neural_history') || '[]');
        const dayMap: Record<string, number> = {};
        history.forEach((sess: any) => {
            const day = sess.timestamp.split(' ')[0];
            dayMap[day] = (dayMap[day] || 0) + sess.reps;
        });
        const vals = Object.values(dayMap).map(v => Number(v));
        return vals.length > 0 ? vals.slice(-7) : [0, 0, 0, 0, 0, 0, 0];
    }

    getDailyAverages() {
        const history = JSON.parse(localStorage.getItem('neural_history') || '[]');
        if (history.length === 0) return { reps: 0, kcal: 0 };
        const totalReps = history.reduce((acc: number, s: any) => acc + s.reps, 0);
        const totalKcal = history.reduce((acc: number, s: any) => acc + s.calories, 0);
        return { reps: Math.round(totalReps / history.length), kcal: Math.round(totalKcal / history.length) };
    }
}

export const gcsClient = new NeuralPersistenceClient();

