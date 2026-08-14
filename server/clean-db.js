const db = require('./db');

try {
  const delAnswers = db.prepare('DELETE FROM answers').run();
  const delBookings = db.prepare('DELETE FROM bookings').run();
  const delAssessments = db.prepare('DELETE FROM assessments').run();
  const delUsers = db.prepare("DELETE FROM users WHERE role != 'ADMIN'").run();
  
  try {
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('answers', 'bookings', 'assessments')").run();
  } catch (e) {
    // sqlite_sequence might not exist
  }

  console.log('Successfully cleared:');
  console.log(`- Answers removed: ${delAnswers.changes}`);
  console.log(`- Bookings removed: ${delBookings.changes}`);
  console.log(`- Assessments removed: ${delAssessments.changes}`);
  console.log(`- Non-admin users removed: ${delUsers.changes}`);
} catch (err) {
  console.error('Error clearing database:', err);
}
