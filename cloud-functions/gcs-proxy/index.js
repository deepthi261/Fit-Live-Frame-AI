/**
 * NEURAL GCS SYNC PROXY (Cloud Function V1/V2)
 * Purpose: Securely uploads JSON session blobs to GCS from the browser.
 * 
 * 1. Create a folder named 'gcs-proxy'
 * 2. Create 'index.js' (this code) and 'package.json' inside it.
 * 3. Deploy: gcloud functions deploy gcsSync --runtime nodejs18 --trigger-http --allow-unauthenticated
 */

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

exports.gcsSync = async (req, res) => {
  // CORS configuration for the browser HUD
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  console.log(`[Neural Link] Request: ${req.method} | Path: ${req.path}`);

  // Handle pre-flight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  // Only POST allowed for proxy actions
  if (req.method !== 'POST') {
    console.warn(`[Neural Fault] Method ${req.method} Rejected.`);
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { bucket: bucketName, path, payload, isMedia, action, contentType: requestedMime } = req.body;

    if (!bucketName || !path) {
      return res.status(400).send("Missing bucket or path.");
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(path);

    // 🚀 NEW: Resumable Upload Tunnel for 5GB+ Archives (like your 7GB recording)
    if (action === 'getSignedUrl') {
      const mime = requestedMime || (path.endsWith('.webm') ? 'video/webm' : (path.endsWith('.mov') ? 'video/quicktime' : 'video/mp4'));

      // Use V4 Signed Resumable Session for maximum browser stability (handles 7GB+)
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'resumable',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
        contentType: mime,
      });

      console.log(`[Neural Tunnel] V4 Protocol Initialized: ${path} (${mime})`);
      return res.status(200).send({ url, path });
    }

    // 📊 NEW: Sheets Proxy (Eliminates CORB/CORS browser issues)
    if (action === 'syncSheets') {
      const { sheetsUrl } = req.body;
      if (!sheetsUrl) return res.status(400).send("Missing Sheets URL.");

      console.log(`[Neural Bridge] Syncing to Sheets: ${sheetsUrl}`);
      const sheetsRes = await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resultText = await sheetsRes.text();
      return res.status(sheetsRes.status).send(resultText);
    }

    if (!payload && !isMedia) return res.status(400).send("Missing payload.");

    const options = {
      resumable: false,
      metadata: {
        contentType: requestedMime || (path.endsWith('.webm') ? 'video/webm' : (path.endsWith('.mov') ? 'video/quicktime' : 'video/mp4')),
        cacheControl: 'public, max-age=3600',
      },
    };

    if (isMedia) {
      const buffer = Buffer.from(payload, 'base64');
      await file.save(buffer, options);
      console.log(`[Neural Media] Archived: gs://${bucketName}/${path}`);
    } else {
      await file.save(JSON.stringify(payload), options);
      console.log(`[Neural Archive] Successfully stored: gs://${bucketName}/${path}`);
    }

    res.status(200).send({ message: "Neural Link Established", path });
  } catch (error) {
    console.error(`[GCS Proxy Failure] Action: ${req.body.action || 'default'} | Path: ${req.body.path}`, error);
    res.status(500).send(`Neural Sync Failure: ${error.message}`);
  }
};

/**
 * 📊 NEURAL SHEETS BRIDGE (Copy to Google Apps Script)
 * --------------------------------------------------
 * 1. Open sheets.new
 * 2. Extensions > Apps Script
 * 3. Paste this code and click 'Deploy > New Deployment > Web App'
 * 4. Execute as: Me | Who has access: Anyone
 * --------------------------------------------------
 */
/*
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);
  const type = data.type || "summary";
  
  // Only process the final Summary report into Sheet1
  if (type === "summary") {
    let sheet = ss.getSheetByName("Sheet1");
    if (!sheet) {
      sheet = ss.insertSheet("Sheet1");
    }
    
    // Exact 8-column header set for AppSheet compatibility
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Workout ID", 
        "Date", 
        "Daily Session #", 
        "Movement Classification", 
        "Verified Reps", 
        "Energy (Kcal)", 
        "Neural Precision", 
        "Coach Insights"
      ]);
    }
    
    // Generate Unique ID
    const workoutId = "NL-" + Date.now() + "-" + Math.floor(Math.random() * 100);
    
    sheet.appendRow([
      workoutId,                // Column 1
      data.timestamp,            // Column 2
      data.sessionNum,          // Column 3
      data.exercise,             // Column 4
      data.reps,                 // Column 5
      data.calories,             // Column 6
      data.precision,            // Column 7
      data.diet                  // Column 8
    ]);
  }
  
  return ContentService.createTextOutput("Neural Summary Processed");
}
*/

