#!/bin/bash

# --- Fit-Live-Frame-AI: Automated Deployment Script ---
# This script automates the build and deployment of the entire project
# to Google Cloud Platform as part of the Gemini Agent AI Challenge.

set -e # Exit on any failure

echo "🎨 Starting Neural Build Process..."

# 1. Install Dependencies
echo "📦 Installing Frontend Dependencies..."
npm install

# 2. Build Frontend
echo "🏗️ Building Vite + TypeScript Artifacts..."
npm run build

# 3. Deploy to Google App Engine
echo "🚀 Deploying Neural Vault Frontend to GAE..."
gcloud app deploy --quiet

# 4. Deploy Cloud Function (The Neural Sync Proxy)
echo "🌊 Deploying GCS Sync Proxy (Cloud Function)..."
gcloud functions deploy gcsSync \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --entry-point gcsSync \
    --source . \
    --region us-central1

# 5. Set CORS for GCS Bucket
echo "🛡️ Synchronizing GCS CORS Policy..."
gsutil cors set gcs_cors.json gs://fit-live-frame-ai

echo "✅ Deployment Complete! The 'Infinity Protocol' is now live."
