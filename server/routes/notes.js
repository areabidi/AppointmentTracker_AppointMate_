// =============================================
// routes/notes.js
// =============================================
// This file handles appointment notes
//
// GET    /api/notes/:appointmentId
//        → get all notes for an appointment
//
// POST   /api/notes
//        → add a note to an appointment
//        → type can be text, audio, or image
//
// PUT    /api/notes/:id
//        → edit a note
//        → only the note creator can edit
//
// DELETE /api/notes/:id
//        → delete a note
//        → only the note creator can delete
//
// All routes require the user to be logged in
// =============================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');


// =============================================
// GET /api/notes/:appointmentId
// =============================================
// Get all notes for a specific appointment
router.get('/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const result = await pool.query(
      `SELECT 
        n.*,
        u.first_name AS created_by_first_name,
        u.last_name AS created_by_last_name
       FROM notes n
       JOIN users u ON n.created_by = u.id
       WHERE n.appointment_id = $1
       ORDER BY n.created_at ASC`,
      [appointmentId]
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Get notes error:', error.message);
    res.status(500).json({ error: 'Server error getting notes' });
  }
});


// =============================================
// POST /api/notes
// =============================================
// Add a note to an appointment
// Accepts: appointment_id, type, content
// type can be: text, audio, image
// For audio and image, content is the file URL
router.post('/', verifyToken, async (req, res) => {
  try {
    const createdBy = req.user.id;
    const { appointment_id, type, content } = req.body;

    // Make sure all required fields are present
    if (!appointment_id || !type || !content) {
      return res.status(400).json({ 
        error: 'Please provide appointment_id, type and content' 
      });
    }

    // Type must be text, audio, or image
    if (!['text', 'audio', 'image'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type must be text, audio, or image' 
      });
    }

    // Check if the appointment exists
    const appointment = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointment_id]
    );

    if (appointment.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Appointment not found' 
      });
    }

    // Create the note
    const result = await pool.query(
      `INSERT INTO notes 
        (appointment_id, created_by, type, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [appointment_id, createdBy, type, content]
    );

    res.status(201).json({
      message: 'Note added successfully!',
      note: result.rows[0]
    });

  } catch (error) {
    console.error('Add note error:', error.message);
    res.status(500).json({ error: 'Server error adding note' });
  }
});


// =============================================
// PUT /api/notes/:id
// =============================================
// Edit a note
// Only the person who created the note can edit it
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ 
        error: 'Please provide content' 
      });
    }

    // Find the note
    const existing = await pool.query(
      'SELECT * FROM notes WHERE id = $1',
      [noteId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only the creator can edit the note
    if (existing.rows[0].created_by !== userId) {
      return res.status(403).json({ 
        error: 'You can only edit your own notes' 
      });
    }

    // Update the note
    const result = await pool.query(
      `UPDATE notes 
       SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [content, noteId]
    );

    res.status(200).json({
      message: 'Note updated successfully!',
      note: result.rows[0]
    });

  } catch (error) {
    console.error('Update note error:', error.message);
    res.status(500).json({ error: 'Server error updating note' });
  }
});


// =============================================
// DELETE /api/notes/:id
// =============================================
// Delete a note
// Only the person who created the note can delete it
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    // Find the note
    const existing = await pool.query(
      'SELECT * FROM notes WHERE id = $1',
      [noteId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only the creator can delete the note
    if (existing.rows[0].created_by !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own notes' 
      });
    }

    // Delete the note
    await pool.query('DELETE FROM notes WHERE id = $1', [noteId]);

    res.status(200).json({
      message: 'Note deleted successfully!'
    });

  } catch (error) {
    console.error('Delete note error:', error.message);
    res.status(500).json({ error: 'Server error deleting note' });
  }
});

module.exports = router;