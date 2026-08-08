// =============================================
// src/components/AppointmentNotes.jsx
// =============================================
// Shows all notes for an appointment
// Allows adding new notes with categories
// Allows deleting your own notes
//
// Features:
// - View all notes
// - Add note with category picker
// - Delete your own notes
//
// Used inside the appointment modal
// in Appointments.jsx
//
// FLOW:
// 1. Component loads → fetches notes
// 2. Shows notes list
// 3. User clicks "+ Add Note" → form appears
// 4. User picks category → text pre-fills
// 5. User edits and saves → note added to list
// 6. User can delete their own notes
// =============================================

import React, { useState, useEffect } from 'react';
import api from '../services/api';

// =============================================
// NOTE CATEGORIES
// =============================================
// Each category has an icon, label, and
// a pre-filled template text
const CATEGORIES = [
  {
    value: 'medication',
    icon: '💊',
    label: 'Medication',
    template: 'Medication note:\nMedication: \nDosage: \nIssue: '
  },
  {
    value: 'doctor',
    icon: '🏥',
    label: 'Doctor Feedback',
    template: 'Doctor feedback:\nDoctor: \nFeedback: \nNext steps: '
  },
  {
    value: 'concern',
    icon: '⚠️',
    label: 'Health Concern',
    template: 'Health concern noted:\nConcern: \nSeverity: \nAction taken: '
  },
  {
    value: 'followup',
    icon: '🔁',
    label: 'Follow-up',
    template: 'Follow-up required:\nReason: \nFollow-up date: \nWith: '
  },
  {
    value: 'transport',
    icon: '🚗',
    label: 'Transport',
    template: 'Transport note:\nPickup time: \nPickup location: \nNotes: '
  },
  {
    value: 'general',
    icon: '📋',
    label: 'General',
    template: ''
  }
];

function AppointmentNotes({ appointmentId }) {

  // Logged in user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // All notes for this appointment
  const [notes, setNotes] = useState([]);

  // Controls if the add note form is visible
  const [showForm, setShowForm] = useState(false);

  // Selected category
  const [category, setCategory] = useState('general');

  // Note text content
  const [content, setContent] = useState('');

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch notes when component loads
  useEffect(() => {
    fetchNotes();
  }, [appointmentId]);

  // =============================================
  // fetchNotes
  // =============================================
  // Calls GET /api/notes/:appointmentId
  // Gets all notes for this appointment
  const fetchNotes = async () => {
    try {
      const response = await api.get(`/notes/${appointmentId}`);
      setNotes(response.data);
    } catch (err) {
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // handleCategorySelect
  // =============================================
  // When a category is selected
  // pre-fill the text area with the template
  const handleCategorySelect = (cat) => {
    setCategory(cat.value);
    setContent(cat.template);
  };

  // =============================================
  // handleAddNote
  // =============================================
  // Calls POST /api/notes
  // Saves the new note to the database
  const handleAddNote = async () => {
    setError('');
    setSuccess('');

    if (!content.trim()) {
      setError('Please write something before saving');
      return;
    }

    try {
      await api.post('/notes', {
        appointment_id: appointmentId,
        type: 'text',
        content: content.trim()
      });

      setSuccess('Note added!');
      setContent('');
      setCategory('general');
      setShowForm(false);
      fetchNotes();

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add note');
    }
  };

  // =============================================
  // handleDeleteNote
  // =============================================
  // Calls DELETE /api/notes/:id
  // Only works if you created the note
  const handleDeleteNote = async (noteId) => {
    setError('');
    try {
      await api.delete(`/notes/${noteId}`);
      fetchNotes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete note');
    }
  };

  // =============================================
  // getCategoryInfo
  // =============================================
  // Returns the icon and label for a note
  // based on its content (checks for template keywords)
  const getCategoryInfo = (content) => {
    if (content.startsWith('Medication')) return { icon: '💊', label: 'Medication' };
    if (content.startsWith('Doctor')) return { icon: '🏥', label: 'Doctor Feedback' };
    if (content.startsWith('Health concern')) return { icon: '⚠️', label: 'Health Concern' };
    if (content.startsWith('Follow-up')) return { icon: '🔁', label: 'Follow-up' };
    if (content.startsWith('Transport')) return { icon: '🚗', label: 'Transport' };
    return { icon: '📋', label: 'General' };
  };

  if (loading) return <div style={styles.loading}>Loading notes...</div>;

  return (
    <div style={styles.container}>

      {/* ── Header row ── */}
      <div style={styles.headerRow}>
        <div style={styles.sectionTitle}>
          Notes ({notes.length})
        </div>
        <button
          style={styles.addBtn}
          onClick={() => {
            setShowForm(!showForm);
            setContent('');
            setCategory('general');
            setError('');
          }}
        >
          {showForm ? 'Cancel' : '+ Add Note'}
        </button>
      </div>

      {/* Error and success messages */}
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      {/* ── Add note form ── */}
      {showForm && (
        <div style={styles.form}>

          {/* Category picker */}
          <div style={styles.categoryLabel}>Category</div>
          <div style={styles.categoryRow}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                style={{
                  ...styles.categoryBtn,
                  ...(category === cat.value ? styles.categoryBtnActive : {})
                }}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Note text area */}
          <textarea
            style={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
            rows={5}
          />

          {/* Save button */}
          <div style={styles.formBtns}>
            <button
              onClick={() => setShowForm(false)}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              style={styles.saveBtn}
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* ── Notes list ── */}
      {notes.length === 0 ? (
        <p style={styles.noNotes}>No notes yet.</p>
      ) : (
        <div style={styles.notesList}>
          {notes.map(note => {
            const catInfo = getCategoryInfo(note.content);
            const isMyNote = note.created_by === user.id;

            return (
              <div key={note.id} style={styles.noteCard}>

                {/* Note header */}
                <div style={styles.noteHeader}>
                  <span style={styles.noteCategory}>
                    {catInfo.icon} {catInfo.label}
                  </span>
                  {/* Only show delete to note creator */}
                  {isMyNote && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      style={styles.deleteBtn}
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Note content */}
                <p style={styles.noteContent}>{note.content}</p>

                {/* Note meta */}
                <p style={styles.noteMeta}>
                  {note.created_by_first_name} {note.created_by_last_name}
                  {' · '}
                  {new Date(note.created_at).toLocaleDateString()}
                </p>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// =============================================
// Styles
// =============================================
const styles = {
  container: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e0e0e0'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#666'
  },
  addBtn: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit'
  },
  loading: {
    fontSize: '13px',
    color: '#999',
    padding: '0.5rem 0'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '0.5rem'
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '0.5rem'
  },
  form: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  categoryLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem'
  },
  categoryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '0.75rem'
  },
  categoryBtn: {
    padding: '4px 10px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    background: 'white',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#555'
  },
  categoryBtnActive: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: '1px solid #1976d2'
  },
  textarea: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    marginBottom: '0.75rem'
  },
  formBtns: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px'
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: 'transparent',
    color: '#666',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit'
  },
  saveBtn: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    background: '#2e7d32',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit'
  },
  noNotes: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic'
  },
  notesList: {
    display: 'grid',
    gap: '0.6rem'
  },
  noteCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '10px 12px'
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  noteCategory: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#555'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0',
    opacity: 0.6
  },
  noteContent: {
    fontSize: '13px',
    color: '#333',
    marginBottom: '4px',
    whiteSpace: 'pre-wrap'
  },
  noteMeta: {
    fontSize: '11px',
    color: '#999'
  }
};

export default AppointmentNotes;