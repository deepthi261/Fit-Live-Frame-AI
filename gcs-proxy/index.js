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

    // Handle pre-flight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    // Only POST allowed
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { bucket, path, payload } = req.body;

        if (!bucket || !path || !payload) {
            return res.status(400).send('Missing bucket, path, or payload.');
        }

        const gcsBucket = storage.bucket(bucket);
        const file = gcsBucket.file(path);

        // Save as JSON blob with caching headers
        await file.save(JSON.stringify(payload), {
            contentType: 'application/json',
            metadata: {
                cacheControl: 'public, max-age=3600',
                contentDisposition: `attachment; filename="${path.split('/').pop()}"`
            }
        });

        console.log(`[Neural Archive] Successfully stored: gs://${bucket}/${path}`);
        res.status(200).send({
            status: "Neural Data Archived",
            ref: `gs://${bucket}/${path}`
        });

    } catch (err) {
        console.error('[GCS Proxy Error]', err);
        res.status(500).send({ error: "Storage synchronization failed: " + err.message });
    }
};
