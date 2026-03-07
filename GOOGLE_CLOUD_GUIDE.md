# 🚀 Neural Fitness Tracker: Google Cloud Guide
**Architecture: Isolated Gcloud Pro Pipeline**

---

## 1. 🏗️ The Project Foundation (Isolated)
```bash
gcloud projects create fit-neural-vault --name="Fit Live Frame AI"
gcloud config set project fit-neural-vault
gcloud services enable appengine.googleapis.com cloudfunctions.googleapis.com storage.googleapis.com cloudbuild.googleapis.com run.googleapis.com
```

## 2. 🗄️ Persistence: Neural Archive (GCS)
```bash
gsutil mb -l us-central1 gs://fit-live-frame-ai
```

## 3. 🛡️ The Sync Proxy (Cloud Function)
Run this EXACT command to bridge the browser to your storage:
```bash
gcloud functions deploy gcsSync \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --entry-point gcsSync \
  --source gcs-proxy
```

## 4. 📊 Tabular Insight: Neural Sheets (Every Day Input)
To view sessions in a spreadsheet:
1.  Open [sheets.new](https://sheets.new).
2.  Go to **Apps Script** and paste the code from `gcs_proxy_function.js`.
3.  Deploy as **Web App** (Who has access: Anyone).
4.  Enter the URL into the App HUD.

## 5. 🌐 App Hosting (Google App Engine)
```bash
npm run build
gcloud app deploy --quiet
```
**URL:** `https://fit-neural-vault.uc.r.appspot.com`

---

## 📊 "Pro" Architecture
| Service | Role | Purpose |
| :--- | :--- | :--- |
| **App Engine** | Host | Serves the React HUD. |
| **GCS Archive** | Vault | Permanent binary/JSON session backups. |
| **Google Sheets** | Viewer | Tabular "Every Day" input for easy reading. |
| **Local Vault** | Persistence | Updates the App Fields (Daily Totals) instantly. |
