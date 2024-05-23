require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

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
    const hashedPassword = await bcrypt.hash(password, 10);  // Hash the password

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
