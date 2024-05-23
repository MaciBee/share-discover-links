const express = require('express');
const router = express.Router();

// Get all questions
router.get('/', (req, res) => {
  const connection = req.app.get('db');
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

// Post a new question
router.post('/', (req, res) => {
  const connection = req.app.get('db');
  const { user_id, question_text } = req.body;

  const query = 'INSERT INTO Questions (user_id, question_text) VALUES (?, ?)';
  
  connection.query(query, [user_id, question_text], (err, result) => {
    if (err) {
      console.error('Error posting question:', err);
      res.status(500).send('Server error');
      return;
    }
    res.send('Question posted successfully!');
  });
});

module.exports = router;
