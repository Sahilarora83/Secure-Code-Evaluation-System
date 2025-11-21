const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get leaderboard for a challenge
router.get('/challenge/:challenge_id', authenticateToken, async (req, res) => {
  try {
    const { challenge_id } = req.params;
    console.log(`📊 Fetching leaderboard for challenge ${challenge_id}`);

    // First verify challenge exists
    const challengeCheck = await pool.query(
      'SELECT id, title FROM challenges WHERE id = $1',
      [challenge_id]
    );

    if (challengeCheck.rows.length === 0) {
      console.log(`❌ Challenge ${challenge_id} not found`);
      return res.status(404).json({ error: 'Challenge not found' });
    }

    console.log(`✅ Challenge found: ${challengeCheck.rows[0].title}`);

    // Get leaderboard data
    const result = await pool.query(
      `SELECT 
        u.id as user_id,
        u.name as candidate_name,
        u.email as candidate_email,
        MAX(a.score) as best_score,
        MAX(a.passed) as best_passed,
        MAX(a.submitted_at) as last_submission,
        COUNT(a.id) as total_attempts,
        MIN(a.execution_time_ms) as best_time
       FROM attempts a
       JOIN users u ON a.candidate_id = u.id
       WHERE a.challenge_id = $1
       GROUP BY u.id, u.name, u.email
       ORDER BY best_score DESC, best_time ASC, last_submission ASC
       LIMIT 100`,
      [challenge_id]
    );

    console.log(`📈 Leaderboard entries: ${result.rows.length}`);

    res.json({ 
      leaderboard: result.rows || [],
      challenge: {
        id: challengeCheck.rows[0].id,
        title: challengeCheck.rows[0].title
      }
    });
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get overall statistics (Admin only)
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM challenges) as total_challenges,
        (SELECT COUNT(*) FROM attempts) as total_attempts,
        (SELECT COUNT(DISTINCT candidate_id) FROM attempts) as total_candidates,
        (SELECT AVG(score) FROM attempts) as average_score,
        (SELECT COUNT(*) FROM users WHERE role = 'candidate') as total_candidates_registered
    `);

    res.json({ statistics: stats.rows[0] });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

