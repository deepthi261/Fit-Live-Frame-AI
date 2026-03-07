/**
 * NEURAL SHEET SYNC V2.0
 * Deep Daily Persistence & Cloud Sync Logic
 */

export interface SessionData {
    reps: number;
    time: string;
    precision: number;
    calories: number;
    exercise: string;
    diet: string;
    gender: 'male' | 'female';
    sessionNum: number;
    timestamp: string;
}

class SheetsClient {
    private scriptUrl: string;

    constructor() {
        this.scriptUrl = localStorage.getItem('neural_sheet_url') || '';
    }

    setScriptUrl(url: string) {
        this.scriptUrl = url;
        localStorage.setItem('neural_sheet_url', url);
    }

    async syncSession(data: SessionData): Promise<boolean> {
        this.saveToLocalVault(data);

        if (!this.scriptUrl) {
            console.warn("[Neural Sheet] No Cloud Key. Saved locally.");
            return false;
        }

        try {
            await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    precision: (data.precision * 100).toFixed(1) + "%",
                }),
            });
            return true;
        } catch (err) {
            console.error("[Neural Sheet] Cloud Fault:", err);
            return false;
        }
    }

    private saveToLocalVault(data: SessionData) {
        const historyRaw = localStorage.getItem('neural_history') || '[]';
        const history = JSON.parse(historyRaw);
        history.push({ ...data, id: Date.now() });
        localStorage.setItem('neural_history', JSON.stringify(history.slice(-100)));

        const today = new Date().toLocaleDateString();
        const dailyStatsRaw = localStorage.getItem(`daily_stats_${today}`) || JSON.stringify({ reps: 0, kcal: 0, sessions: 0 });
        const dailyStats = JSON.parse(dailyStatsRaw);

        dailyStats.reps += data.reps;
        dailyStats.kcal += data.calories;
        dailyStats.sessions += 1;

        localStorage.setItem(`daily_stats_${today}`, JSON.stringify(dailyStats));
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

        const values = Object.values(dayMap).map(v => Number(v));
        return values.length > 0 ? values.slice(-7) : [0, 0, 0, 0, 0, 0, 0];
    }

    getDailyAverages() {
        const history = JSON.parse(localStorage.getItem('neural_history') || '[]');
        if (history.length === 0) return { reps: 0, kcal: 0 };

        const totalReps = history.reduce((acc: number, s: any) => acc + s.reps, 0);
        const totalKcal = history.reduce((acc: number, s: any) => acc + s.calories, 0);

        return {
            reps: Math.round(totalReps / history.length),
            kcal: Math.round(totalKcal / history.length)
        };
    }
}

export const sheetsClient = new SheetsClient();
