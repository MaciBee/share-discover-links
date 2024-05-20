const mysql = require('mysql');
const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

// Create a connection to the database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

app.get('/questions', (req, res) => {
  const query = `
    SELECT q.question_id, q.question_text, q.created_at, u.username
    FROM Questions q
    JOIN users u ON q.user_id = u.id
  `;
  
  connection.query(query, (error, results, fields) => {
    if (error) {
      console.error('Error fetching questions:', error);
      res.status(500).send('Server error');
      return;
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
