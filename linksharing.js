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
//const cors = require('cors'); // installed to fix 500 error when registering ///jk didn't need it after all- disabled. too many security concerns


// Create the Express application
const app = express();

app.use(express.json());
app.use(cookieParser());
///app.use(cors()); // This opens up all routes to all origins. ///disabled see^^

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

//category route for public.html added 3.28.25 xo 
app.get('/category/:category', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'category.html'));
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
    body('category_id').isInt().withMessage('Valid category ID is required'),
    body('tags').optional().isArray(),
    body('isPublic').isBoolean()  ///public links
], async (req, res) => {
/// error handle 
    console.log("Request data:", req.body); // Log the entire request body

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
///3rror handle
        console.error("Validation errors:", errors.array()); // Log validation errors

        return res.status(400).json({ errors: errors.array() });
    }


//newer  code 4 categories
 // Capture the incoming data from the request body correctly
    const { url, title, description, category_id, tags, isPublic } = req.body;

    try {
        // Correct the SQL query to properly insert all data, including 'is_public'
        const [linkResult] = await pool.query(
            'INSERT INTO links (user_id, url, title, description, category_id, is_public) VALUES (?, ?, ?, ?, ?, ?)', 
            [req.session.userId, url, title, description, category_id, isPublic || false]
        );
        const linkId = linkResult.insertId;

        // Handle tags if they are provided
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

//fetch links 
app.get('/api/my-links', async (req, res) => {
    if (!req.session.userId) {
        return res.sendStatus(401); // Unauthorized if not logged in
    }
    try {
        const [links] = await pool.query(`
		SELECT l.*, GROUP_CONCAT(t.name ORDER BY t.name ASC) AS tags, c.name AS category_name
		FROM links l
		LEFT JOIN link_tags lt ON l.id = lt.link_id
		LEFT JOIN tags t ON lt.tag_id = t.id
		LEFT JOIN categories c ON l.category_id = c.id
		WHERE l.user_id = ? AND l.is_public = 0  
		GROUP BY l.id;
        `, [req.session.userId]);

        // Formatting links to ensure proper JSON structure for tags
        const formattedLinks = links.map(link => ({
            ...link,
            tags: link.tags ? link.tags.split(',') : []
        }));

        res.json({ success: true, links: formattedLinks });
    } catch (error) {
        console.error('Error fetching private links:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch private links' });
    }
});

// old code w.o categories- commented out on agu 5th
//    const { url, title, description, category, tags, isPublic } = req.body;
//    try {
//        const [linkResult] = await pool.query('INSERT INTO links (user_id, url, title, description, is_public) VALUES (?, ?, ?, ?, ?)', [req.session.userId, url, title, description, isPublic]);
//        const linkId = linkResult.insertId;

//        if (tags && tags.length > 0) {
//            for (const tag of tags) {
//                await pool.query('INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id=id', [tag]);
//                await pool.query('INSERT INTO link_tags (link_id, tag_id) SELECT ?, id FROM tags WHERE name = ?', [linkId, tag]);
//            }
//        }

//        res.json({ success: true, message: 'Link submitted successfully', linkId: linkId });
//    } catch (error) {
//        console.error('Error submitting link:', error);
//        res.status(500).json({ success: false, message: 'Error submitting link' });
//    }
//});


// Fetch all links for authenticated user with categories 8.5.24
//app.get('/api/my-links', async (req, res) => {
//    if (!req.session.userId) {
//        return res.sendStatus(401);  // Unauthorized if not logged in
//    }
//    try {
//        const [links] = await pool.query(`
//            SELECT l.*, GROUP_CONCAT(t.name ORDER BY t.name ASC) AS tags, c.name AS category
//            FROM links l
//            LEFT JOIN link_tags lt ON l.id = lt.link_id
//            LEFT JOIN tags t ON lt.tag_id = t.id
//            LEFT JOIN categories c ON l.category_id = c.id  
//            WHERE l.user_id = ? AND l.is_private = 1  
//            GROUP BY l.id
//        `, [req.session.userId]);
//        res.json({ success: true, links });
//    } catch (error) {
//        console.error('Error fetching private links:', error);
//        res.status(500).json({ success: false, message: 'Failed to fetch links' });
//    }
//});

//commented out version of above code-fetch links for authenticated usrs- bc it doesnt inlcude categories 
//app.get('/api/my-links', async (req, res) => {
//    if (!req.session.userId) {
//        return res.sendStatus(401);
//    }
//    try {
//        const [links] = await pool.query(`
//            SELECT l.*, GROUP_CONCAT(t.name ORDER BY t.name ASC) AS tags
//            FROM links l
//            LEFT JOIN link_tags lt ON l.id = lt.link_id
//            LEFT JOIN tags t ON lt.tag_id = t.id
//            WHERE l.user_id = ?
//            GROUP BY l.id`, [req.session.userId]);

//        res.json({ success: true, links });
//    } catch (error) {
//        console.error('Error fetching links:', error);
//        res.status(500).json({ success: false, message: 'Failed to fetch links' });
//    }
//});

///commented out bc categories werent in public links 8.6.24
// Fetch all public links endpoint
//app.get('/api/public-links', async (req, res) => {
//    try {
        // This SQL query assumes you have a way to determine which links are public
        // For example, there might be an 'is_public' column in your 'links' table
//       const [links] = await pool.query(`
//            SELECT l.id, l.url, l.title, l.description, GROUP_CONCAT(t.name ORDER BY t.name ASC) AS tags
//            FROM links l
//            LEFT JOIN link_tags lt ON l.id = lt.link_id
//            LEFT JOIN tags t ON lt.tag_id = t.id
//            WHERE l.is_public = 1
//            GROUP BY l.id`);
 //       
        // Mapping over links to ensure tags are split into arrays if not already
//        const formattedLinks = links.map(link => ({
//           ...link,
//            tags: link.tags ? link.tags.split(',') : []
//        }));

//        res.json({ success: true, links: formattedLinks });
//    } catch (error) {
//        console.error('Error fetching public links:', error);
//        res.status(500).json({ success: false, message: 'Failed to fetch public links' });
//    }
//});

///fetch public links w. categories  8.6.24
//app.get('/api/public-links', async (req, res) => {
//    try {
//        const [links] = await pool.query(`
//            SELECT l.id, l.url, l.title, l.description, l.is_public, c.name AS category_name
//            FROM links l
//            LEFT JOIN categories c ON l.category_id = c.id
//            WHERE l.is_public = 1
//            GROUP BY l.id
//        `);
        
//        res.json({
//            success: true,
//            links: links.map(link => ({
//                ...link,
//                tags: link.tags ? link.tags.split(',') : [] // Assuming tags are stored as a comma-separated string
//            }))
//        });
//    } catch (error) {
//        console.error('Error fetching public links:', error);
//        res.status(500).json({ success: false, message: 'Failed to fetch public links' });
//    }
//});

//categories display?
app.get('/api/public-links', async (req, res) => {
    try {
        const [links] = await pool.query(`
            SELECT l.id, l.url, l.title, l.description, l.is_public, c.name AS category_name, GROUP_CONCAT(t.name ORDER BY t.name ASC) AS tags
            FROM links l
            LEFT JOIN link_tags lt ON l.id = lt.link_id
            LEFT JOIN tags t ON lt.tag_id = t.id
            LEFT JOIN categories c ON l.category_id = c.id
            WHERE l.is_public = 1
            GROUP BY l.id
        `);

        // Map over links to ensure tags are split into arrays if not already
        const formattedLinks = links.map(link => ({
            ...link,
            tags: link.tags ? link.tags.split(',') : []  
        }));

        res.json({ success: true, links: formattedLinks });
    } catch (error) {
        console.error('Error fetching public links:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch public links' });
    }
});


// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
