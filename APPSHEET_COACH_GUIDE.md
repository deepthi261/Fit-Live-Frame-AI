# 📋 Neural Fitness: Coach AppSheet Setup Guide

This guide ensures your **FIT Live Frame AI** data flows perfectly into your coach's AppSheet app.

---

## 🏗️ Phase 1: The Foundations (Spreadsheet Setup)

1.  **Open your Google Sheet.**
2.  Go to **Extensions > Apps Script**.
3.  Paste the code from your project's `gcs_proxy_function.js` (found in the `📊 NEURAL SHEETS BRIDGE` section).
4.  **Important:** In the Apps Script editor, click **Deploy > New Deployment**.
    *   **Select Type:** Web App
    *   **Execute as:** Me
    *   **Who has access:** Anyone (This is mandatory)
5.  **Copy the "Web App URL"** (it ends in `/exec`).

---

## 🚨 CRITICAL STEP: Activate the Portal

The site needs to know *where* to send your data. It does not happen automatically!

1.  Open the site: **[fit-neural-vault.uc.r.appspot.com](https://fit-neural-vault.uc.r.appspot.com)**.
2.  In the bottom-right "3D Spatial Form Map" box, click the small **Gear (Settings Icon)**.
3.  **PASTE your Web App URL** from Phase 1 into the "Neural Sheet Endpoint" box.
4.  Refresh the page. Your site is now "connected" to your personal sheet.

---

## 📱 Phase 2: Connecting AppSheet

1.  **Copy the Template:** [AppSheet Workout Template](https://www.appsheet.com/templates/Log-and-track-workouts-with-this-simple-app?appGuidString=54d52632-d8c7-4cb4-8498-618e8f833be5).
2.  **Bind Your Data:**
    *   In AppSheet: **Data > Tables > Add New Data**.
    *   Select your Google Sheet and choose the **`Logs`** tab (This tab is created automatically after your first session ends).
3.  **Column Names:** Our app now sends data matching these template headers:
    *   `ID`, `Date`, `Exercise`, `Reps`, `Duration`, `Calories Burned`, `Neural Precision`, `Coach Notes`

---

## 🏁 Phase 3: Final Test
1.  Run a 30-second session on the site.
2.  Click **Finish**.
3.  Watch the **`Logs`** tab in your spreadsheet—the data will appear within seconds.
4.  Open AppSheet—the coach will see the new row instantly.

---

## 🎨 Phase 3: Designing the Coach Dashboard

1.  **Create a View:** Go to **App > Views**.
2.  **Add View:** Click **New View** and name it "Athlete Progress".
3.  **Type:** Choose **Deck** or **Table**.
4.  **Sorting:** Set **Sort by** to **Date** (Descending) so recent workouts show first.
5.  **Color Coding:** 
    *   Go to **App > Format Rules**.
    *   Create a rule for "High Intensity": If `Verified Reps` > 40, set color to **Green/Neon-Cyan**.

---

## 👨‍🏫 Phase 4: Sharing with the Coach

1.  Click the **Share** (User icon) in the top-right of the AppSheet Editor.
2.  Enter your coach's email address.
3.  Select **"Used as an App User"**.
4.  They will receive an email to install the AppSheet app on their phone (iOS/Android).

---

## 🧬 How the Neural-Sync Works:
*   **Athlete Action:** You use the [Neural Site](https://fit-neural-vault.uc.r.appspot.com) to track your movements.
*   **Neural Pulse:** As soon as you finish, the site pushes the verified counts and unique IDs to the Sheet.
*   **Coach Result:** The AppSheet app on the coach's phone refreshes automatically (or with a swipe down), showing the result of the session immediately.

**Setup Complete! Your Neural Link is now reaching the coach's palm.**
