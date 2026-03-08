import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFitnessIntelligenceString } from "./fitnessIntelligence";

// Neural Shield 12.0: MediaPipe-Aware Pose Intelligence
let isRequestInProgress = false;

const ENGINE_MODE = "gemini-1.5-flash";
const NEURAL_GAP_MS = 60000; // 60s gap - 1 RPM - Daily Quota Protection

export class GeminiLiveClient {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private onMessage: (data: any, rawText?: string) => void = () => { };
    private isProcessing = false;
    private frameCount = 0;
    private exerciseBuffer: string[] = []; // Temporal Hysteresis Buffer to prevent "spam" flickering

    private lastState: {
        reps: number;
        sets: number;
        exercise: string;
        voice: string;
        precision: number;
        lastSync: string;
        frameCount: number;
        diet: string;
        gender: 'male' | 'female';
        keypoints?: {
            landmarks: Record<string, { x: number, y: number, z: number, visibility: number }>;
            worldLandmarks?: Record<string, { x: number, y: number, z: number }>;
        };
    } = {
            reps: 0,
            sets: 1,
            exercise: "READY",
            voice: "Neural Link Online.",
            precision: 0,
            lastSync: "--:--",
            frameCount: 0,
            diet: "",
            gender: 'male'
        };

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);

        const storedReps = parseInt(localStorage.getItem('session_reps') || '0');
        this.lastState.reps = storedReps;

        this.model = this.genAI.getGenerativeModel({
            model: ENGINE_MODE,
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.1,
                // responseMimeType: "application/json", // Removed for v1/v1beta universal compatibility
            }
        }, { apiVersion: 'v1beta' });
    }

    setCallback(callback: (data: any, rawText?: string) => void) {
        this.onMessage = callback;
        this.onMessage(this.lastState, "[Neural Link] Synchronizing...");
    }

    async sendMedia(input: string) {
        this.frameCount++;
        if (input.startsWith('[META]')) {
            this.lastState.reps = 0;
            localStorage.setItem('session_reps', '0');
            this.onMessage(this.lastState, input);
            return;
        }
        if (this.isProcessing) return;
        this.processFrame(input);
    }

    private isBackingOff = false;

    async processFrame(input: string): Promise<void> {
        if (this.isProcessing || this.isBackingOff || isRequestInProgress) return;

        const now = Date.now();
        const lastReq = parseInt(localStorage.getItem('shadow_last_req_v14') || '0');

        if (now - lastReq < NEURAL_GAP_MS) return;
        localStorage.setItem('shadow_last_req_v14', now.toString());

        this.isProcessing = true;
        isRequestInProgress = true;

        try {
            if (!input.includes('data:image')) throw new Error("Frame Stream Interrupted");

            const [header, data] = input.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

            this.onMessage({ ...this.lastState, voice: "Analyzing Biomechanics..." });

            const fitnessTheory = getFitnessIntelligenceString();
            const prompt = `ACT AS: A Vision-Based Biomechanical Analyst.
                ${fitnessTheory}

                MISSION:
                1. Observe frames. Evaluate posture and movement.
                2. Identify exercise (UPPERCASE). Count reps based on full eccentric-concentric cycles.
                3. DETECT LANDMARKS: Identify coordinates for the 33 MediaPipe Pose Landmarks.
                
                Current Exercise State: ${this.lastState.exercise}. 
                Current Reps: ${this.lastState.reps}.

                OUTPUT SCHEMA (STRICT JSON ONLY):
                {
                  "exercise": string,
                  "reps": number,
                  "precision": number (0-1),
                  "voice": "Direct coaching feedback",
                  "diet": "Nutritional advice",
                  "gender": "male" | "female",
                  "keypoints": {
                    "landmarks": { "nose": {"x": 0.5, "y": 0.5, "z": 0.1, "visibility": 0.99}, ... }
                  }
                }`;

            const result = await this.model.generateContent([
                { inlineData: { data, mimeType } },
                { text: prompt }
            ]);

            this.handleAIUpdate(result.response.text());

        } catch (err: any) {
            console.error("[CRITICAL] Neural Fault:", err);
            const is429 = err?.message?.includes('429') || err?.status === 429;
            if (is429) {
                this.lastState.exercise = "[!] API OFF";
                this.lastState.voice = "Daily Quota Hit. Performance Mode Offline.";
                this.isBackingOff = true;
                setTimeout(() => { this.isBackingOff = false; }, 60000);
            }
            this.onMessage(this.lastState);
        } finally {
            await new Promise(resolve => setTimeout(resolve, 5000));
            this.isProcessing = false;
            isRequestInProgress = false;
        }
    }

    private getConsensusExercise(newExercise: string): string {
        this.exerciseBuffer.push(newExercise);
        if (this.exerciseBuffer.length > 5) this.exerciseBuffer.shift();

        const counts: Record<string, number> = {};
        this.exerciseBuffer.forEach(ex => counts[ex] = (counts[ex] || 0) + 1);

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        if (sorted[0][1] >= 3) {
            return sorted[0][0];
        }
        return this.lastState.exercise;
    }

    private playAudioFeedback(text: string, type: 'rep' | 'info' | 'alert' = 'info') {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        if (type === 'rep') {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.8;
            utterance.pitch = 1.2;
            utterance.volume = 0.8;
            window.speechSynthesis.speak(utterance);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.6;
        window.speechSynthesis.speak(utterance);
    }

    private calculateAngle(a: any, b: any, c: any): number {
        if (!a || !b || !c) return 180;
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
    }

    private analyzeBiomechanics(landmarks: any): string | null {
        if (!landmarks) return null;

        const lH = landmarks.left_hip;
        const lK = landmarks.left_knee;
        const lA = landmarks.left_ankle;
        const lS = landmarks.left_shoulder;
        const lE = landmarks.left_elbow;
        const lW = landmarks.left_wrist;
        const rK = landmarks.right_knee;
        const rH = landmarks.right_hip;

        // 1. SQUATS: Knee Flexion < 110
        if (lH && lK && lA) {
            const kneeAngle = this.calculateAngle(lH, lK, lA);
            if (kneeAngle < 110) return "SQUATS";
        }

        // 2. SIT-UPS: Hip Flexion < 95 while horizontal
        if (lS && lH && lK) {
            const hipAngle = this.calculateAngle(lS, lH, lK);
            if (hipAngle < 95 && lS.y > lH.y - 0.1) return "SIT-UPS";
        }

        // 3. LUNGES: Vertical knee diff
        if (lK && rK && lH && rH) {
            const kneeDiff = Math.abs(lK.y - rK.y);
            if (kneeDiff > 0.2) return "LUNGES";
        }

        // 4. BICEP CURLS: Elbow Flexion < 95
        if (lS && lE && lW) {
            const armAngle = this.calculateAngle(lS, lE, lW);
            if (armAngle < 95) return "BICEP CURLS";
        }

        // 5. WALKING: Horizontal ankle movement
        if (landmarks.left_ankle && landmarks.right_ankle) {
            const moveX = Math.abs(landmarks.left_ankle.x - landmarks.right_ankle.x);
            if (moveX > 0.05 && moveX < 0.2) return "WALKING";
        }

        // 6. DEADLIFT: Hip Flexion with Straight Knees
        if (lS && lH && lK && lA) {
            const hipAngle = this.calculateAngle(lS, lH, lK);
            const kneeAngle = this.calculateAngle(lH, lK, lA);
            if (hipAngle < 120 && kneeAngle > 150) return "DEADLIFTS";
        }

        // 7. PUSHUP/PLANK
        if (lS && lH && lK) {
            const backAngle = this.calculateAngle(lS, lH, lK);
            if (backAngle > 160 && lS.y > 0.5) return "PUSHUPS";
        }

        return null;
    }

    private handleAIUpdate(responseText: string) {
        console.log("NEURAL BRAIN:", responseText);
        try {
            let cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const startIdx = cleaned.indexOf('{');
            const endIdx = cleaned.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) cleaned = cleaned.substring(startIdx, endIdx + 1);

            const metadata = JSON.parse(cleaned);
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour12: false });

            const nodes = metadata.keypoints?.landmarks || metadata.keypoints || {};
            const rawExercise = (metadata.exercise || "READY").toUpperCase().trim();
            const heuristicExercise = this.analyzeBiomechanics(nodes);

            // 🛡️ CONFIDENCE HIERARCHY: Heuristic > Gemini Grouping
            const bestGuess = heuristicExercise || rawExercise;
            const finalizedExercise = this.getConsensusExercise(bestGuess);

            // 🔊 AUDIO FEEDBACK ENGINE
            if (metadata.reps > this.lastState.reps) {
                this.playAudioFeedback(`${metadata.reps}`, 'rep');
            } else if (finalizedExercise !== this.lastState.exercise && finalizedExercise !== "READY") {
                this.playAudioFeedback(`Starting ${finalizedExercise}`, 'info');
            }

            if (metadata.reps !== undefined && metadata.reps >= this.lastState.reps) {
                this.lastState.reps = metadata.reps;
                localStorage.setItem('session_reps', this.lastState.reps.toString());
            }

            this.lastState = {
                ...this.lastState,
                exercise: finalizedExercise,
                voice: metadata.voice ?? this.lastState.voice,
                precision: metadata.precision ?? this.lastState.precision,
                diet: metadata.diet ?? this.lastState.diet,
                gender: metadata.gender ?? this.lastState.gender,
                keypoints: metadata.keypoints ?? this.lastState.keypoints,
                lastSync: timeStr
            };

            this.onMessage(this.lastState, responseText);
        } catch (err) {
            this.onMessage(this.lastState, "[Neural Sync Lag]");
        }
    }

    getFrameCount() { return this.frameCount; }

    stopSession() {
        this.isProcessing = false;
        this.isBackingOff = false;
        isRequestInProgress = false;
        localStorage.removeItem('shadow_last_req_v14');
    }
}

export const geminiClient = new GeminiLiveClient(localStorage.getItem('gemini_key') || '');
