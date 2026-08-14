const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbFiles = [
  'D:/English/Latest/c-suite-english-to-send/server/database.sqlite',
  'D:/English/c-suite-english/server/database.sqlite',
  'D:/English/c-suite-english-to-send/server/database.sqlite',
  'D:/English/c-suite-english-updated/server/database.sqlite',
  'D:/English/c-suite-english - Copy/server/database.sqlite'
];

for (const dbPath of dbFiles) {
  if (fs.existsSync(dbPath)) {
    try {
      const db = new Database(dbPath);
      const ansInfo = db.prepare('DELETE FROM answers').run();
      const bookInfo = db.prepare('DELETE FROM bookings').run();
      const assInfo = db.prepare('DELETE FROM assessments').run();
      const userInfo = db.prepare("DELETE FROM users WHERE role != 'ADMIN'").run();
      try {
        db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('answers', 'bookings', 'assessments', 'users')").run();
      } catch (e) {}
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
      console.log(`[SUCCESS] Cleaned database at: ${dbPath}`);
      console.log(`  - Users deleted: ${userInfo.changes}`);
      console.log(`  - Assessments deleted: ${assInfo.changes}`);
      console.log(`  - Answers deleted: ${ansInfo.changes}`);
      console.log(`  - Bookings deleted: ${bookInfo.changes}`);
    } catch (err) {
      console.error(`[ERROR] Failed to clean ${dbPath}:`, err.message);
    }
  } else {
    console.log(`[SKIP] Not found: ${dbPath}`);
  }
}
