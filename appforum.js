require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Registration endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    pool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (err, results) => {
            if (err) {
                console.error('Failed to register user:', err);
                return res.status(500).json({ message: 'Failed to register user' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        }
    );
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) {
                console.error('Failed to retrieve user:', err);
                return res.status(500).json({ message: 'Failed to login' });
            }

            if (results.length > 0) {
                const comparison = await bcrypt.compare(password, results[0].password);
                if (comparison) {
                    res.json({ message: 'Login successful' });
                } else {
                    res.status(401).json({ message: 'Invalid credentials' });
                }
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        }
    );
});

// Endpoint to get all questions
app.get('/questions', (req, res) => {
    pool.query('SELECT * FROM Questions ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching questions:', err);
            return res.status(500).json({ message: 'Failed to fetch questions' });
        }
        res.json(results);
    });
});

// Endpoint to add a new question
app.post('/questions', (req, res) => {
    const { question_text, user_id } = req.body;
    pool.query('INSERT INTO Questions (question_text, user_id) VALUES (?, ?)', [question_text, user_id], (err, results) => {
        if (err) {
            console.error('Failed to insert question:', err);
            return res.status(500).json({ message: 'Failed to submit question' });
        }
        res.status(201).json({ message: 'Question submitted successfully' });
    });
});

// Endpoint to get all answers for a specific question
app.get('/answers', (req, res) => {
    const { question_id } = req.query;
    pool.query('SELECT * FROM Answers WHERE question_id = ? ORDER BY created_at DESC', [question_id], (err, results) => {
        if (err) {
            console.error('Error fetching answers:', err);
            return res.status(500).json({ message: 'Failed to fetch answers' });
        }
        res.json(results);
    });
});

// Endpoint to add a new answer
app.post('/answers', (req, res) => {
    const { answer_text, question_id, user_id, author } = req.body; // include author
    pool.query(
        'INSERT INTO Answers (answer_text, question_id, user_id, author) VALUES (?, ?, ?, ?)', 
        [answer_text, question_id, user_id, author], // Pass author here
        (err, results) => {
            if (err) {
                console.error('Failed to insert answer:', err);
                return res.status(500).json({ message: 'Failed to post answer', error: err.sqlMessage });
            }
            res.status(201).json({ message: 'Answer posted successfully' });
        }
    );
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
