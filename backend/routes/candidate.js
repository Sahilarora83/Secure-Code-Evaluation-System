const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get candidate's statistics and attempts summary
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get overall stats
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM attempts WHERE candidate_id = $1) as total_attempts,
        (SELECT COUNT(DISTINCT challenge_id) FROM attempts WHERE candidate_id = $1) as challenges_attempted,
        (SELECT MAX(score) FROM attempts WHERE candidate_id = $1) as best_score,
        (SELECT AVG(score) FROM attempts WHERE candidate_id = $1) as average_score
    `, [userId]);

    // Get attempts per challenge
    const attemptsPerChallenge = await pool.query(`
      SELECT 
        c.id as challenge_id,
        c.title as challenge_title,
        c.language,
        c.duration_minutes,
        COUNT(a.id) as attempt_count,
        MAX(a.score) as best_score,
        MAX(a.submitted_at) as last_attempt,
        MAX(a.passed) as best_passed
      FROM challenges c
      LEFT JOIN attempts a ON c.id = a.challenge_id AND a.candidate_id = $1
      GROUP BY c.id, c.title, c.language, c.duration_minutes
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json({
      statistics: stats.rows[0],
      challenges: attemptsPerChallenge.rows
    });
  } catch (error) {
    console.error('Get candidate stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

