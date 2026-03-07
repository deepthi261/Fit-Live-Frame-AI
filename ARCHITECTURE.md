# AI Human Fitness Tracker Architecture

This project implements a high-performance, AI-driven fitness monitoring system focusing on real-time pose tracking, biomechanical analysis, and cross-session persistence. This document outlines both the current **Local Intelligence** architecture and the proposed **Google Cloud Pro** pipeline for deployment.

---

## 1. ⚛️ Current Application Architecture (Local + Edge)

The current implementation leverages **Edge Computing** (Browser-side processing) for sub-second visual feedback and **Google Gemini 1.5 Flash** for high-level athletic reasoning.

### **A. Perception Layer (MediaPipe/Client)**
*   **Media Capture**: Captured via `MediaCapture.tsx` from local camera or video upload.
*   **Skeletonization**: Uses `@mediapipe/pose` to identify 33 high-accuracy 3D landmarks in the browser.
*   **Neural Node Layer**: Draws a live kinematic skeleton (Neon Cyan) to confirm the "Neural Link" is locked.

### **B. Intelligence Layer (Gemini Client)**
*   **Biomechanical Engine**: A math-based local heuristic in `geminiClient.ts` that calculates joint angles (Squats, Bicep Curls, etc.) for zero-latency detection.
*   **Gemini 1.5 Cloud Brain**: The core AI analyzing frame-by-frame data via the `v1beta` endpoint to provide qualitative coaching feedback ("Neural Link Command").
*   **Temporal Hysteresis Buffer**: A 5-frame consensus logic filter that eliminates flickering and "Spam" data entries.

### **C. Persistence & Coaching (Local/Cloud Vault)**
*   **Web Speech API**: Provides real-time audio coaching and counts reps aloud to ensure user focus.
*   **Local Vault (localStorage)**: Stores daily aggregate reps and metabolic data.
*   **Neural Archive (GCS)**: Integrated with **Google Cloud Storage** to persist session blobs as JSON objects for "every day of input" storage. This provides enterprise-grade durability.

---

## 2. ☁️ Google Cloud Deployment (Cloud Run)

To move this application into 24/7 production, we leverage **Google Cloud Platform (GCP)**. The following architecture (from the project "Pipeline" diagram) provides horizontal scalability and enterprise-grade reliability.

### **Deployment Workflow (Two-Way Deployment)**

#### **Option 1: Professional Cloud Deployment (Cloud Run)**
We provide a **containerized** deployment strategy using Docker. This ensures environment consistency and allows the app to scale based on traffic.

1.  **Build the Container**: Compile the Vite app and wrap it in an Nginx-powered Alpine Linux container.
2.  **Artifact Registry**: Push the image to GCP's Artifact Registry.
3.  **Cloud Run Deployment**: Host the container as a serverless service (Auto-scaling to zero).

```bash
# Example Deployment Command
gcloud run deploy fitness-tracker \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

#### **Option 2: Local Deployment (Development)**
Maintain a high-speed local dev loop using the current setup.

```bash
# Launch Local Environment
npm install
npm run dev
```

---

## 3. 🚀 "Pro" Intelligence Pipeline (Roadmap)

Following the project's visual blueprint, the next evolution involves **Vertex AI Search** and **Lyria 3 Audio**:

*   **Network Load Balancer**: For global traffic management of multiple user clients.
*   **Agentic Loop (Python/ADK)**: Moving the "Brain" to include a backend logic layer that can orchestrate more complex multi-modal reasoning.
*   **Vertex AI Search**: Grounding the AI's feedback in a "Knowledge Base" of professional athletic standards.
*   **Firestore/SQL**: Replacing basic Google Sheets for massive user-scale session history and personalized athlete profiles.

---

### UI Components Used:
*   **Stats Console**: Live HUD monitoring for Vitals, Reps, and Metabolic Burn.
*   **Shadow Report**: Post-session "Session Expenditure Audit" and "Nutritional Protocol" advisor.
*   **Neural History Vault**: Cross-session catalog for daily trend analysis.
