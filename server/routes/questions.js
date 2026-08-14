const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeAdmin);

// Get all questions
router.get('/', (req, res) => {
  try {
    const questions = db.prepare('SELECT * FROM questions ORDER BY id ASC').all();
    // Parse options for frontend consumption
    const parsedQuestions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));
    res.json(parsedQuestions);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new question
router.post('/', (req, res) => {
  const { category, text, options, correct_answer } = req.body;
  if (!category || !text || !options || correct_answer === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare('INSERT INTO questions (category, text, options, correct_answer) VALUES (?, ?, ?, ?)');
    const info = stmt.run(category, text, JSON.stringify(options), correct_answer);
    res.status(201).json({ id: info.lastInsertRowid, category, text, options, correct_answer });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Update question
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { category, text, options, correct_answer } = req.body;
  
  if (!category || !text || !options || correct_answer === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare('UPDATE questions SET category = ?, text = ?, options = ?, correct_answer = ? WHERE id = ?');
    const info = stmt.run(category, text, JSON.stringify(options), correct_answer, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete question
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM questions WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
