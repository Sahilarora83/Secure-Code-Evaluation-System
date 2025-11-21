const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all challenges
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as created_by_name 
       FROM challenges c 
       LEFT JOIN users u ON c.created_by = u.id 
       ORDER BY c.created_at DESC`
    );
    res.json({ challenges: result.rows });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single challenge
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as created_by_name 
       FROM challenges c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = result.rows[0];
    
    // Hide test cases from candidates (only show to admins)
    if (req.user.role !== 'admin') {
      challenge.testcases = challenge.testcases.map(tc => ({
        input: tc.input,
        description: tc.description
        // Don't send expectedOutput to candidates
      }));
    }

    res.json({ challenge });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create challenge (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, language, testcases, expires_at, duration_minutes } = req.body;

    if (!title || !description || !language || !testcases || !Array.isArray(testcases)) {
      return res.status(400).json({ error: 'Title, description, language, and testcases are required' });
    }

    const result = await pool.query(
      `INSERT INTO challenges (title, description, language, testcases, created_by, expires_at, duration_minutes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, description, language, JSON.stringify(testcases), req.user.id, expires_at || null, duration_minutes || null]
    );

    res.status(201).json({ challenge: result.rows[0] });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update challenge (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, language, testcases, expires_at, duration_minutes } = req.body;

    const result = await pool.query(
      `UPDATE challenges 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           language = COALESCE($3, language),
           testcases = COALESCE($4, testcases),
           expires_at = COALESCE($5, expires_at),
           duration_minutes = COALESCE($6, duration_minutes)
       WHERE id = $7 
       RETURNING *`,
      [
        title || null,
        description || null,
        language || null,
        testcases ? JSON.stringify(testcases) : null,
        expires_at || null,
        duration_minutes !== undefined ? duration_minutes : null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({ challenge: result.rows[0] });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete challenge (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM challenges WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

