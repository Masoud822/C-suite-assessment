const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeAdmin);

// Get all users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all assessments with user details
router.get('/assessments', (req, res) => {
  try {
    const assessments = db.prepare(`
      SELECT a.*, u.name, u.email 
      FROM assessments a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.started_at DESC
    `).all();
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});
// Get detailed results for a specific assessment
router.get('/assessments/:id', (req, res) => {
  const { id } = req.params;
  try {
    const assessment = db.prepare(`
      SELECT a.*, u.name, u.email 
      FROM assessments a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(id);

    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const answers = db.prepare(`
      SELECT 
        q.text AS question_text, 
        q.category,
        q.options, 
        q.correct_answer, 
        a.selected_option
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.assessment_id = ?
      ORDER BY a.id ASC
    `).all(id);

    // Parse options from JSON strings
    const detailedAnswers = answers.map(ans => ({
      ...ans,
      options: JSON.parse(ans.options),
      is_correct: ans.selected_option === ans.correct_answer
    }));

    res.json({ assessment, answers: detailedAnswers });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Clear all candidate assessment responses, bookings, and candidate records
router.post('/clear-responses', (req, res) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM answers').run();
      db.prepare('DELETE FROM bookings').run();
      db.prepare('DELETE FROM assessments').run();
      db.prepare("DELETE FROM users WHERE role != 'ADMIN'").run();
      try {
        db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('answers', 'bookings', 'assessments', 'users')").run();
      } catch (e) {
        // sequence may not exist
      }
    })();
    res.json({ success: true, message: 'All candidate data and assessment responses cleared successfully.' });
  } catch (err) {
    console.error('Error clearing database:', err);
    res.status(500).json({ error: 'Failed to clear responses' });
  }
});

module.exports = router;
