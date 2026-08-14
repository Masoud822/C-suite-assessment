const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Ensure db directory exists
const dbPath = path.join(__dirname, 'database.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'CANDIDATE',
      phone TEXT,
      age TEXT,
      country TEXT,
      job_title TEXT,
      company TEXT,
      linkedin TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      cefr_level TEXT DEFAULT 'Pending',
      c_suite_level TEXT DEFAULT 'Pending',
      infractions_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'IN_PROGRESS',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option INTEGER,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      assessment_id INTEGER,
      linkedin TEXT,
      preferred_time TEXT,
      current_role TEXT,
      communication_frequency TEXT,
      why_now TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      text TEXT NOT NULL,
      options TEXT NOT NULL, -- Stored as JSON string
      correct_answer INTEGER NOT NULL
    );
  `);

  // Ensure extra columns exist if table was created previously
  const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  const candidateCols = [
    { name: 'phone', type: 'TEXT' },
    { name: 'age', type: 'TEXT' },
    { name: 'country', type: 'TEXT' },
    { name: 'job_title', type: 'TEXT' },
    { name: 'company', type: 'TEXT' },
    { name: 'linkedin', type: 'TEXT' }
  ];
  for (const col of candidateCols) {
    if (!userColumns.includes(col.name)) {
      try {
        db.prepare(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`).run();
      } catch (e) {
        // column may already exist
      }
    }
  }

  // Seed questions if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
  if (count === 0) {
    console.log('Seeding initial questions...');
    const initialQuestions = require('./data/questions');
    const insert = db.prepare('INSERT INTO questions (category, text, options, correct_answer) VALUES (?, ?, ?, ?)');
    
    db.transaction(() => {
      for (const q of initialQuestions) {
        insert.run(q.category, q.text, JSON.stringify(q.options), q.correctAnswer);
      }
    })();
    console.log('Questions seeded.');
  }

  // Seed Admin User if doesn't exist
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123123';
  const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin');
  if (!adminUser) {
    console.log('Seeding default admin user...');
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Administrator', 'admin', hash, 'ADMIN');
    console.log('Admin seeded.');
  }

  console.log('Database schema initialized.');
};

initDb();

module.exports = db;
