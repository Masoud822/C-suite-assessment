const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendAdminReport } = require('../utils/email');

const router = express.Router();

const getCategoryMap = (questions) => {
  const map = [];
  let currentCategory = null;
  let startIdx = 0;
  
  const labels = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.category !== currentCategory) {
      if (currentCategory !== null) {
        map.push({ name: currentCategory, label: labels[map.length] || `Section ${map.length + 1}`, startIdx });
      }
      currentCategory = q.category;
      startIdx = i;
    }
  }
  if (currentCategory !== null) {
    map.push({ name: currentCategory, label: labels[map.length] || `Section ${map.length + 1}`, startIdx });
  }
  return map;
};

// Helper functions for diagnostic report grading
const calculateAssessmentReport = (userId, assessmentId) => {
  const user = db.prepare('SELECT id, name, email, role, job_title, company FROM users WHERE id = ?').get(userId);
  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId);
  
  const allAnswers = db.prepare(`
    SELECT a.selected_option, q.id as question_id, q.category, q.correct_answer
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE a.assessment_id = ?
    ORDER BY q.id ASC
  `).all(assessmentId);

  const totalQuestions = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
  const correctCount = allAnswers.filter(a => a.selected_option === a.correct_answer).length;
  const accuracy = Math.round((correctCount / (totalQuestions || 1)) * 100);

  // Group by category
  const categoryStats = {};
  for (const ans of allAnswers) {
    if (!categoryStats[ans.category]) {
      categoryStats[ans.category] = { correct: 0, total: 0 };
    }
    categoryStats[ans.category].total += 1;
    if (ans.selected_option === ans.correct_answer) {
      categoryStats[ans.category].correct += 1;
    }
  }

  // Section details
  const sectionMeta = {
    'Grammar': {
      title: 'GRAMMAR DECISIONS',
      subtitle: 'Grammatical mechanics & complex reported tenses.'
    },
    'Vocabulary': {
      title: 'C-SUITE LEXICAL RESOURCE',
      subtitle: 'Precision corporate collocations & registry.'
    },
    'Situations': {
      title: 'COMMUNICATION JUDGMENT',
      subtitle: 'Tactful, leadership-aligned workplace decisions.'
    }
  };

  const sectionRatings = Object.keys(categoryStats).map(cat => {
    const stats = categoryStats[cat];
    const percentage = Math.round((stats.correct / (stats.total || 1)) * 100);
    const meta = sectionMeta[cat] || {
      title: `${cat.toUpperCase()} MASTERY`,
      subtitle: `Key competencies in ${cat.toLowerCase()} assessment.`
    };

    let badge = 'NEEDS IMPROVEMENT';
    let badgeType = 'warning';
    if (percentage >= 75) {
      badge = 'STRONG';
      badgeType = 'success';
    } else if (percentage >= 55) {
      badge = 'COMPETENT';
      badgeType = 'info';
    }

    return {
      category: cat,
      title: meta.title,
      subtitle: meta.subtitle,
      score: stats.correct,
      total: stats.total,
      percentage,
      badge,
      badgeType
    };
  });

  const scoreOutOf40 = Math.round((correctCount / (totalQuestions || 1)) * 40);
  const { getFrameworkEntryByScore } = require('../data/learningPaths');
  const entry = getFrameworkEntryByScore(scoreOutOf40);

  return {
    candidate: {
      name: user ? user.name : 'Candidate',
      email: user ? user.email : '',
      role: user && user.job_title ? user.job_title : (user && user.company ? `${user.company} Executive` : 'Executive Candidate'),
      linkedin: user ? user.linkedin : ''
    },
    score: correctCount,
    totalQuestions: totalQuestions || allAnswers.length,
    accuracy,
    scoreOutOf40,
    cefrLevel: entry.level,
    cSuiteStage: {
      title: entry.stage,
      description: entry.oneLineExplanation
    },
    oneLineExplanation: entry.oneLineExplanation,
    diagnosticSummary: entry.diagnosticSummary,
    sectionRatings,
    recommendedPath: entry.learningPath,
    learningPath: entry.learningPath
  };
    },
    diagnosticSummary,
    sectionRatings,
    recommendedPath
  };
};

// Start a new assessment
router.post('/start', authenticateToken, (req, res) => {
  try {
    const prevAssessments = db.prepare('SELECT id FROM assessments WHERE user_id = ?').all(req.user.id);
    for (const p of prevAssessments) {
      db.prepare('DELETE FROM answers WHERE assessment_id = ?').run(p.id);
    }
    db.prepare('DELETE FROM assessments WHERE user_id = ?').run(req.user.id);

    const stmt = db.prepare('INSERT INTO assessments (user_id) VALUES (?)');
    const info = stmt.run(req.user.id);
    
    const rawQuestions = db.prepare('SELECT id, category, text, options FROM questions ORDER BY id ASC').all();
    const questions = rawQuestions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    res.json({ 
      assessmentId: info.lastInsertRowid, 
      question: questions[0],
      questions: questions,
      answers: {},
      questionIndex: 0,
      totalQuestions: questions.length,
      categories: getCategoryMap(questions)
    });
  } catch (err) {
    console.error('Error starting assessment:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Resume or get current question / results
router.get('/current', authenticateToken, (req, res) => {
  try {
    const activeAssesment = db.prepare('SELECT * FROM assessments WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
    if (!activeAssesment) {
      return res.status(404).json({ error: 'No assessment found' });
    }

    const rawQuestions = db.prepare('SELECT id, category, text, options FROM questions ORDER BY id ASC').all();
    const questions = rawQuestions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    const rawAnswers = db.prepare('SELECT question_id, selected_option FROM answers WHERE assessment_id = ?').all(activeAssesment.id);
    const answersMap = {};
    for (const a of rawAnswers) {
      answersMap[a.question_id] = a.selected_option;
    }

    const answerCount = rawAnswers.length;
    
    if (activeAssesment.status === 'COMPLETED' || answerCount >= questions.length) {
      const results = calculateAssessmentReport(req.user.id, activeAssesment.id);
      return res.json({ finished: true, results });
    }

    const currentQuestion = questions[answerCount] || questions[0];

    res.json({
      assessmentId: activeAssesment.id,
      question: currentQuestion,
      questions: questions,
      answers: answersMap,
      questionIndex: answerCount,
      totalQuestions: questions.length,
      categories: getCategoryMap(questions)
    });
  } catch (err) {
    console.error('Error fetching current assessment:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Submit answer for current question (supports update/review)
router.post('/submit-answer', authenticateToken, (req, res) => {
  const { assessmentId, questionId, selectedOption, isFinal } = req.body;
  
  if (questionId === undefined || selectedOption === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let currentAssessment = null;
    if (assessmentId) {
      currentAssessment = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(assessmentId, req.user.id);
    }
    
    if (!currentAssessment) {
      currentAssessment = db.prepare('SELECT * FROM assessments WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
    }

    if (!currentAssessment) {
      const stmt = db.prepare('INSERT INTO assessments (user_id) VALUES (?)');
      const info = stmt.run(req.user.id);
      currentAssessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(info.lastInsertRowid);
    }

    const activeId = currentAssessment.id;

    const existingAnswer = db.prepare('SELECT * FROM answers WHERE assessment_id = ? AND question_id = ?').get(activeId, questionId);
    if (existingAnswer) {
      db.prepare('UPDATE answers SET selected_option = ? WHERE id = ?').run(selectedOption, existingAnswer.id);
    } else {
      db.prepare('INSERT INTO answers (assessment_id, question_id, selected_option) VALUES (?, ?, ?)').run(activeId, questionId, selectedOption);
    }

    // Recalculate score
    const allAnswers = db.prepare(`
      SELECT a.selected_option, q.correct_answer 
      FROM answers a 
      JOIN questions q ON a.question_id = q.id 
      WHERE a.assessment_id = ?
    `).all(activeId);
    
    const newScore = allAnswers.filter(a => a.selected_option === a.correct_answer).length;
    db.prepare('UPDATE assessments SET score = ? WHERE id = ?').run(newScore, activeId);

    const rawQuestions = db.prepare('SELECT id, category, text, options FROM questions ORDER BY id ASC').all();
    const questions = rawQuestions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    if (isFinal || allAnswers.length >= questions.length) {
      const report = calculateAssessmentReport(req.user.id, activeId);
      
      db.prepare('UPDATE assessments SET status = ?, completed_at = CURRENT_TIMESTAMP, cefr_level = ?, c_suite_level = ? WHERE id = ?')
        .run('COMPLETED', report.cefrLevel, report.cSuiteStage.title, activeId);
        
      const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.user.id);
      const updatedAssessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(activeId);
      
      try {
        sendAdminReport(user, updatedAssessment);
      } catch (e) {}
        
      return res.json({ 
        finished: true, 
        results: report
      });
    }

    res.json({
      success: true,
      totalQuestions: questions.length,
      categories: getCategoryMap(questions)
    });

  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Book Speaking Assessment
router.post('/book-speaking', authenticateToken, (req, res) => {
  const { linkedin, preferredTime, currentRole, communicationFrequency, whyNow, assessmentId } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO bookings (user_id, assessment_id, linkedin, preferred_time, current_role, communication_frequency, why_now)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      req.user.id,
      assessmentId || null,
      linkedin || '',
      preferredTime || '',
      currentRole || '',
      communicationFrequency || '',
      whyNow || ''
    );
    
    if (linkedin) {
      db.prepare('UPDATE users SET linkedin = ? WHERE id = ?').run(linkedin, req.user.id);
    }
    
    res.json({ success: true, bookingId: info.lastInsertRowid });
  } catch (err) {
    console.error('Error saving speaking booking:', err);
    res.status(500).json({ error: 'Failed to submit booking' });
  }
});

// Log anti-cheat infraction and increment counter in database
router.post('/log-infraction', authenticateToken, (req, res) => {
  const { assessmentId, type } = req.body;
  if (!assessmentId) {
    return res.status(400).json({ error: 'Missing assessmentId' });
  }
  try {
    const assessment = db.prepare('SELECT id, infractions_count FROM assessments WHERE id = ? AND user_id = ?').get(assessmentId, req.user.id);
    if (assessment) {
      db.prepare('UPDATE assessments SET infractions_count = infractions_count + 1 WHERE id = ?').run(assessmentId);
      return res.json({ success: true, infractionsCount: (assessment.infractions_count || 0) + 1 });
    }
    res.status(404).json({ error: 'Assessment not found' });
  } catch (err) {
    console.error('Error logging infraction:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
