const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { executeCode } = require('../services/daytona');

const router = express.Router();

// Run code (test execution)
router.post('/run', authenticateToken, async (req, res) => {
  try {
    const { code, language, challenge_id } = req.body;

    if (!code || !language || !challenge_id) {
      return res.status(400).json({ error: 'Code, language, and challenge_id are required' });
    }

    // Get challenge with test cases
    const challengeResult = await pool.query(
      'SELECT testcases, language FROM challenges WHERE id = $1',
      [challenge_id]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];
    const testCases = challenge.testcases || [];

    // Execute code using Daytona
    const executionResult = await executeCode(code, language, testCases);

    res.json({
      success: executionResult.success,
      output: executionResult.output,
      passed: executionResult.passed,
      failed: executionResult.failed,
      execution_time_ms: executionResult.execution_time_ms,
      status: executionResult.status,
      testResults: executionResult.testResults,
      error: executionResult.error
    });
  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit final code
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { code, challenge_id } = req.body;

    if (!code || !challenge_id) {
      return res.status(400).json({ error: 'Code and challenge_id are required' });
    }

    // Get challenge with test cases
    const challengeResult = await pool.query(
      'SELECT testcases, language FROM challenges WHERE id = $1',
      [challenge_id]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];
    const testCases = challenge.testcases || [];

    // Execute code using Daytona
    const executionResult = await executeCode(code, challenge.language, testCases);

    // Calculate score
    const totalTests = testCases.length;
    const score = totalTests > 0 
      ? Math.round((executionResult.passed / totalTests) * 100) 
      : 0;

    // Save attempt to database
    const attemptResult = await pool.query(
      `INSERT INTO attempts 
       (challenge_id, candidate_id, code, output, score, passed, failed, execution_time_ms, status, test_results) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        challenge_id,
        req.user.id,
        code,
        executionResult.output,
        score,
        executionResult.passed,
        executionResult.failed,
        executionResult.execution_time_ms,
        executionResult.status,
        JSON.stringify(executionResult.testResults)
      ]
    );

    res.status(201).json({
      message: 'Code submitted successfully',
      attempt: attemptResult.rows[0],
      execution: {
        output: executionResult.output,
        passed: executionResult.passed,
        failed: executionResult.failed,
        execution_time_ms: executionResult.execution_time_ms,
        status: executionResult.status,
        score
      }
    });
  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all attempts for a challenge (Admin) or user's own attempts
router.get('/challenge/:challenge_id', authenticateToken, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin') {
      // Admin can see all attempts
      query = `
        SELECT a.*, u.name as candidate_name, u.email as candidate_email, c.title as challenge_title
        FROM attempts a
        JOIN users u ON a.candidate_id = u.id
        JOIN challenges c ON a.challenge_id = c.id
        WHERE a.challenge_id = $1
        ORDER BY a.submitted_at DESC
      `;
      params = [req.params.challenge_id];
    } else {
      // Candidates can only see their own attempts
      query = `
        SELECT a.*, c.title as challenge_title
        FROM attempts a
        JOIN challenges c ON a.challenge_id = c.id
        WHERE a.challenge_id = $1 AND a.candidate_id = $2
        ORDER BY a.submitted_at DESC
      `;
      params = [req.params.challenge_id, req.user.id];
    }

    const result = await pool.query(query, params);
    res.json({ attempts: result.rows });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single attempt
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as candidate_name, u.email as candidate_email, c.title as challenge_title
       FROM attempts a
       JOIN users u ON a.candidate_id = u.id
       JOIN challenges c ON a.challenge_id = c.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attempt = result.rows[0];

    // Only allow access if user is admin or the attempt owner
    if (req.user.role !== 'admin' && attempt.candidate_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Hide code from candidates (only show to admin)
    // Always hide code from candidates, even if they own the attempt
    if (req.user.role !== 'admin') {
      attempt.code = null; // Set to null instead of string
    }

    res.json({ attempt });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

