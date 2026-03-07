# 🛰️ GCP Deployment & API Integration Brief
### *Fit-Live-Frame-AI: Official Proof of Infrastructure*

This document provides a concise summary of the Google Cloud Platform (GCP) services and Gemini AI integrations used in the **Fit-Live-Frame-AI** project for the Gemini Agent AI Challenge.

---

## 🚀 1. Production Hosting (App Engine)
- **Deployment URL:** [fit-neural-vault.uc.r.appspot.com](https://fit-neural-vault.uc.r.appspot.com)
- **Service:** Google App Engine (Node.js 20 Standard Environment).
- **Proof:** The `.appspot.com` domain is the primary indicator of a successful, live GCP App Engine deployment.

## 🧠 2. AI & Vertex AI Integration (Gemini 1.5 Flash)
- **File:** [`src/lib/geminiClient.ts`](https://github.com/deepthi261/Fit-Live-Frame-AI/blob/main/src/lib/geminiClient.ts)
- **Integration:** Directly utilizes the `GoogleGenerativeAI` SDK to interact with **Gemini 1.5 Flash**.
- **Usage:** Implements real-time "Vision-to-JSON" neural streaming for biomechanical pose analysis and rep counting.

## ⚡ 3. Media Vaulting (Cloud Storage & Cloud Functions)
- **File:** [`src/lib/cloudStorageClient.ts`](https://github.com/deepthi261/Fit-Live-Frame-AI/blob/main/src/lib/cloudStorageClient.ts)
- **Services:** Google Cloud Storage (GCS) and Google Cloud Functions.
- **Protocol:** Implements the **"Infinity Sync Protocol"** using V4 Signed Resumable Tunnels. This allows for unbreakable archival of massive video assets (7GB+) directly from the browser to a secure GCS bucket.

## 🌉 4. Secure Telemetry Proxy (Cloud Function)
- **File:** [`gcs_proxy_function.js`](https://github.com/deepthi261/Fit-Live-Frame-AI/blob/main/gcs_proxy_function.js)
- **Service:** Google Cloud Functions (HTTP Trigger).
- **Security:** Acts as a "Neural Bridge" to bypass browser CORB/CORS restrictions, securely proxying session data from the frontend to Google Sheets/AppSheet.

## 🤖 5. Automated Deployment (Infrastructure-as-Code)
- **File:** [`deploy.sh`](https://github.com/deepthi261/Fit-Live-Frame-AI/blob/main/deploy.sh)
- **Automation:** A single-command shell script that orchestrates the entire deployment pipeline using the `gcloud` and `gsutil` CLIs.
- **Workflow:** Automates the frontend build, app engine deployment, cloud function synchronization, and GCS bucket security configuration.

---
*Documentation generated for the Gemini Agent AI Challenge.*
