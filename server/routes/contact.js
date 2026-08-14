const express = require('express');
const db = require('../db');

const router = express.Router();

// Submit a Get in Touch / Contact message
router.post('/', (req, res) => {
  const { name, email, phone, company, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO contact_messages (name, email, phone, company, subject, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim() : '',
      company ? company.trim() : '',
      subject ? subject.trim() : 'General Inquiry',
      message.trim()
    );

    res.status(201).json({ success: true, messageId: info.lastInsertRowid });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ error: 'Failed to save contact message' });
  }
});

module.exports = router;
