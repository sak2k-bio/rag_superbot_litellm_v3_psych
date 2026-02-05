import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export async function saveToGoogleSheets(data: {
    timestamp: string;
    patientId: string;
    demographics: string;
    diagnosis: string;
    protocolSummary: string;
}) {
    try {
        const rawCredentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (!rawCredentials || !spreadsheetId) {
            console.warn('⚠️ Google Sheets credentials or ID not found. Skipping save.');
            console.warn('GOOGLE_SHEET_ID:', spreadsheetId ? 'SET' : 'MISSING');
            console.warn('GOOGLE_SHEETS_CREDENTIALS:', rawCredentials ? 'SET' : 'MISSING');
            return;
        }

        console.log('📊 Attempting to save to Google Sheets...');
        console.log('Sheet ID:', spreadsheetId);

        const credentials = JSON.parse(rawCredentials);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const values = [
            [
                data.timestamp,
                data.patientId,
                data.demographics,
                data.diagnosis,
                data.protocolSummary,
            ],
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:E', // Adjust range/sheet name as needed
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });

        console.log('✅ Successfully saved to Google Sheets');
    } catch (error) {
        console.error('❌ Error saving to Google Sheets:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        // Don't throw, just log. We don't want to break the app if sheets fails.
    }
}
