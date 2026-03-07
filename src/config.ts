/**
 * 🛰️ NEURAL LINK PRODUCTION CONFIGURATION
 * These values are baked into the production build to allow 
 * zero-config access for all users.
 */

export const NEURAL_CONFIG = {
    // 🧠 The "Brain" - Gemini 1.5 API Key (REDACTED FOR SECURITY)
    GEMINI_API_KEY: "",

    // 🌊 The "Sync Agent" - Cloud Function URL
    GCS_SYNC_URL: "https://us-central1-fit-neural-vault.cloudfunctions.net/gcsSync",

    // 🗄️ The "Vault" - GCS Bucket Name
    GCS_BUCKET_NAME: "fit-live-frame-ai",

    // 📊 The "Reporter" - Google Sheets Apps Script URL
    NEURAL_SHEET_URL: "https://script.google.com/macros/s/AKfycbyQXVFtW_Y-MqicBV53_zFlLeFEpT0km0cOf6kmj23GSfr_Pw0BQ_IORKFxfwWSDy_S/exec"
};
