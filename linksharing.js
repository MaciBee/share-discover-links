// Import required modules
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { body, validationResult } = require('express-validator');
const path = require('path'); // Import the path module
const cookieParser = require('cookie-parser');
const cors = require('cors'); // installed to fix 500 error when registering 


// Create the Express application
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors()); // This opens up all routes to all origins. For production, configure it appr>

// Serve static files from the 'public' directory- added for /public 
app.use(express.static(path.join(__dirname, 'public')));



// Setup database connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}).promise();

// Session store setup
const sessionStore = new MySQLStore({}, pool);

// Session configuration
app.use(session({
    key: 'session_cookie_name',
    secret: 'session_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Serve static files under the '/discover' path
app.use('/discover', express.static(path.join(__dirname, 'public')));

// Default route to serve 'discover.html'
app.get('/discover', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'discover.html'));
});

// Register user endpoint
app.post('/api/register', [
    body('username').isString(),
    body('password').isLength({ min: 5 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});
////

// User login endpoint
app.post('/api/login', [
    body('username').trim().isString().isLength({ min: 1 }).withMessage('Username is required'),
    body('password').isString().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Incorrect username or password' });
        }
        const user = users[0];
        if (await bcrypt.compare(password, user.password_hash)) {
            req.session.userId = user.id; // Assumes session setup is correctly done
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: 'Incorrect username or password' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Submit Link endpoint with tags
app.post('/api/submit-link', [
    body('url').isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('title').isLength({ max: 255 }),
    body('description').optional().isString(),
    body('tags').optional().isArray()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { url, title, description, tags } = req.body;
    try {
        const [linkResult] = await pool.query('INSERT INTO links (user_id, url, title, description) VALUES (?, ?, ?, ?)', [req.session.userId, url, title, description]);
        const linkId = linkResult.insertId;

        if (tags && tags.length > 0) {
            for (const tag of tags) {
                await pool.query('INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id=id', [tag]);
                await pool.query('INSERT INTO link_tags (link_id, tag_id) SELECT ?, id FROM tags WHERE name = ?', [linkId, tag]);
            }
        }

        res.json({ success: true, message: 'Link submitted successfully', linkId: linkId });
    } catch (error) {
        console.error('Error submitting link:', error);
        res.status(500).json({ success: false, message: 'Error submitting link' });
    }
});

// Fetch all links for authenticated user
app.get('/api/my-links', async (req, res) => {
    if (!req.session.userId) {
        return res.sendStatus(401);
    }
    try {
        const [links] = await pool.query(`
            SELECT l.*, GROUP_CONCAT(t.name ORDER BY t.name ASC) AS tags
            FROM links l
            LEFT JOIN link_tags lt ON l.id = lt.link_id
            LEFT JOIN tags t ON lt.tag_id = t.id
            WHERE l.user_id = ?
            GROUP BY l.id`, [req.session.userId]);

        res.json({ success: true, links });
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch links' });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
