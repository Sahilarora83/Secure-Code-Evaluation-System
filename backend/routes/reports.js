const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Generate PDF report
router.post('/generate/:attempt_id', authenticateToken, async (req, res) => {
  try {
    const { attempt_id } = req.params;

    // Get attempt details
    const attemptResult = await pool.query(
      `SELECT a.*, u.name as candidate_name, u.email as candidate_email, 
              c.title as challenge_title, c.description as challenge_description
       FROM attempts a
       JOIN users u ON a.candidate_id = u.id
       JOIN challenges c ON a.challenge_id = c.id
       WHERE a.id = $1`,
      [attempt_id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attempt = attemptResult.rows[0];

    // Only allow access if user is admin or the attempt owner
    if (req.user.role !== 'admin' && attempt.candidate_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `report_${attempt_id}_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../reports', filename);

    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filepath));

    // PDF Content
    doc.fontSize(20).text('Code Evaluation Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Candidate: ${attempt.candidate_name}`);
    doc.text(`Email: ${attempt.candidate_email}`);
    doc.text(`Challenge: ${attempt.challenge_title}`);
    doc.text(`Submitted: ${new Date(attempt.submitted_at).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(16).text('Results', { underline: true });
    doc.fontSize(12);
    doc.text(`Score: ${attempt.score}%`);
    doc.text(`Tests Passed: ${attempt.passed}`);
    doc.text(`Tests Failed: ${attempt.failed}`);
    doc.text(`Execution Time: ${attempt.execution_time_ms}ms`);
    doc.text(`Status: ${attempt.status}`);
    doc.moveDown();

    if (attempt.test_results && attempt.test_results.length > 0) {
      doc.fontSize(16).text('Test Case Results', { underline: true });
      doc.fontSize(10);
      attempt.test_results.forEach((test, index) => {
        doc.text(`Test ${index + 1}: ${test.passed ? 'PASSED' : 'FAILED'}`);
        if (test.input) doc.text(`  Input: ${test.input}`);
        if (test.expectedOutput) doc.text(`  Expected: ${test.expectedOutput}`);
        if (test.actualOutput) doc.text(`  Actual: ${test.actualOutput}`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown();
    doc.fontSize(16).text('Code Submission', { underline: true });
    doc.fontSize(10);
    doc.text(attempt.code, {
      align: 'left',
      width: 500
    });

    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    // Save report record
    const pdfUrl = `/reports/${filename}`;
    await pool.query(
      'INSERT INTO reports (attempt_id, pdf_url) VALUES ($1, $2) RETURNING *',
      [attempt_id, pdfUrl]
    );

    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filepath).pipe(res);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all reports (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, a.candidate_id, u.name as candidate_name, c.title as challenge_title
       FROM reports r
       JOIN attempts a ON r.attempt_id = a.id
       JOIN users u ON a.candidate_id = u.id
       JOIN challenges c ON a.challenge_id = c.id
       ORDER BY r.created_at DESC`
    );
    res.json({ reports: result.rows });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

