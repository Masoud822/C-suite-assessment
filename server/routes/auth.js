const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Candidate Registration (Passwordless)
router.post('/register', async (req, res) => {
  const { name, email, phone, age, country, job_title, company, linkedin } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userRole = 'CANDIDATE';
    
    // Check if candidate already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    let userId;
    
    if (existing) {
      // If candidate already exists, update their profile
      db.prepare(`
        UPDATE users 
        SET name = ?, phone = COALESCE(?, phone), age = COALESCE(?, age), 
            country = COALESCE(?, country), job_title = COALESCE(?, job_title), 
            company = COALESCE(?, company), linkedin = COALESCE(?, linkedin)
        WHERE id = ?
      `).run(name, phone || null, age || null, country || null, job_title || null, company || null, linkedin || null, existing.id);
      
      userId = existing.id;
    } else {
      const stmt = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, age, country, job_title, company, linkedin) 
        VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(name, normalizedEmail, userRole, phone || '', age || '', country || '', job_title || '', company || '', linkedin || '');
      userId = info.lastInsertRowid;
    }
    
    const user = db.prepare('SELECT id, name, email, role, phone, age, country, job_title, company, linkedin FROM users WHERE id = ?').get(userId);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Database error occurred during registration' });
  }
});

// Admin-Only Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE (email = ? OR name = ?) AND role = ?').get(email.trim(), email.trim(), 'ADMIN');
    if (!user) {
      return res.status(404).json({ error: 'Email or username not found', field: 'email' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect password', field: 'password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
