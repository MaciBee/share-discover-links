const express = require('express');
const app = express();
const port = 3000;

// Middleware (if CORS is needed)
const cors = require('cors');
app.use(cors());

// Your Google Sheets API setup here...

app.get('/grevocab', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: '1fx-q-86hGn2IbaDqQSYPDC-payKnhWatqwpeiFDH5Ts',
            range: 'Sheet1!A:C',
        });
        const randomWord = getRandomWord(response.data.values);
        res.json(randomWord);
    } catch (error) {
        console.error('Error: ' + error);
        res.status(500).send('Error fetching word');
    }
});

app.listen(port, () => {
  console.log(`Server running at http://autodidacting.org:3000/grevocab`);
});








const { google } = require('googleapis');

// Load the JSON key (Replace 'your-json-key-filename.json' with your actual JSON key filename)
const key = require('./grevocab-415110-320372df1df1.json'); 

// Set up Google Auth client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: key.client_email,
    private_key: key.private_key.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Initialize Sheets API client
const sheets = google.sheets({ version: 'v4', auth });

// Function to read data from a spreadsheet
async function readSpreadsheet(spreadsheetId, range) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    console.log(response.data.values);
  } catch (error) {
    console.error('The API returned an error: ' + error);
  }
}

// Call the function with your spreadsheet ID and range
// Replace 'your-spreadsheet-id' with your actual spreadsheet ID
// Replace 'Sheet1!A:C' with your actual range
readSpreadsheet('1fx-q-86hGn2IbaDqQSYPDC-payKnhWatqwpeiFDH5Ts', 'Sheet1!A:C');



//selects random word 

function getRandomWord(data) {
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex];
}
