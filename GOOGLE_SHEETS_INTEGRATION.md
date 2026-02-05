# Google Sheets Integration Setup

This guide explains how to set up the Google Sheets integration for the Therapy Craft Mode.

## Prerequisites

- A Google Cloud Platform (GCP) Project.
- A Google Sheet to store the data.

## Step 1: Create a Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project.
3. Go to **IAM & Admin** > **Service Accounts**.
4. Click **Create Service Account**.
5. Name it (e.g., "therapy-bot-sheets").
6. Click **Create and Continue**.
7. Grant the **Editor** role (or specifically Sheets API access).
8. Click **Done**.
9. Click on the newly created service account email.
10. Go to the **Keys** tab.
11. Click **Add Key** > **Create new key**.
12. Select **JSON** and click **Create**.
13. A JSON file will be downloaded. **Keep this secure!**

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, searching for "Google Sheets API".
2. Click **Enable**.

## Step 3: Prepare the Google Sheet

1. Create a new Google Sheet (e.g., "Therapy Bot Data").
2. Get the **Sheet ID** from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`.
3. Share the sheet with the **Service Account Email** (found in the JSON file or Console) as an **Editor**.
4. Create a header row in the first sheet (e.g., "Timestamp", "Patient ID", "Demographics", "Diagnosis", "Protocol Summary").

## Step 4: Configure Environment Variables

1. Open your `.env.local` (or `.env`).
2. Add the following variables:

```env
GOOGLE_SHEET_ID=your_sheet_id_here
# Flatten the JSON credentials into a single line string
GOOGLE_SHEETS_CREDENTIALS='{"type": "service_account", ...}'
```

**Note:** For `GOOGLE_SHEETS_CREDENTIALS`, you need to paste the entire content of the downloaded JSON file as a single line string.

## Step 5: Install Dependencies

Ensure you have the `googleapis` package installed:

```bash
npm install googleapis
```
