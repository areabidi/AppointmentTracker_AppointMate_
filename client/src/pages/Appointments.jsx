// =============================================
// src/pages/Appointments.jsx
// =============================================
// This page shows all appointments in two views:
//
// 1. Calendar view — like Google Calendar
//    appointments show as colored pills on dates
//    clicking an appointment opens a modal
//
// 2. List view — shows all appointments as cards
//
// Users can:
// - Switch between calendar and list view
// - Click an appointment to see full details
// - Create a new appointment
// - Cancel an appointment (reason required)
// - Edit an appointment
// - See notes attached to an appointment
//
// Color coding:
// Blue   → upcoming
// Green  → completed
// Red    → cancelled
// =============================================

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../services/api';
import AppointmentDriver from '../components/AppointmentDriver';
import AppointmentNotes from '../components/AppointmentNotes';

// =============================================
// momentLocalizer
// =============================================
// react-big-calendar needs a date library
// to handle formatting dates and times
// We use moment.js for this
const localizer = momentLocalizer(moment);

function Appointments() {
  // All appointments from the backend
  const [appointments, setAppointments] = useState([]);

  // Notes for the selected appointment
  const [notes, setNotes] = useState([]);

  // The appointment that was clicked
  // null means no modal is open
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Controls which view is active
  // 'calendar' or 'list'
  const [view, setView] = useState('calendar');

  // Controls if the create form is visible
  const [showForm, setShowForm] = useState(false);

  // Tracks loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New appointment form data
  const [formData, setFormData] = useState({
    patient_id: '',
    title: '',
    location: '',
    appointment_time: ''
  });

  // Cancel reason when cancelling an appointment
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  // Edit form data
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    location: '',
    appointment_time: ''
  });

  // Get the logged in user
  const user = JSON.parse(localStorage.getItem('user'));

  // Fetch appointments when page loads
  useEffect(() => {
    fetchAppointments();
  }, []);

  // =============================================
  // fetchAppointments
  // =============================================
  // Gets all appointments from the backend
  // The backend automatically filters based on
  // who is logged in (patient or caregiver)
  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (err) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // fetchNotes
  // =============================================
  // Gets all notes for a specific appointment
  // Called when an appointment is clicked
  const fetchNotes = async (appointmentId) => {
    try {
      const response = await api.get(`/notes/${appointmentId}`);
      setNotes(response.data);
    } catch (err) {
      setNotes([]);
    }
  };

  // =============================================
  // handleEventClick
  // =============================================
  // Called when user clicks an appointment
  // on the calendar or in the list
  // Opens the modal with full details
  const handleEventClick = async (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditing(false);
    setCancellingId(null);
    setCancelReason('');
    await fetchNotes(appointment.id);
  };

  // =============================================
  // calendarEvents
  // =============================================
  // react-big-calendar needs events in a specific
  // format with title, start, and end properties
  // We convert our appointments to that format
  const calendarEvents = appointments.map(apt => ({
    // Spread all appointment data so we can
    // access it when the event is clicked
    ...apt,
    title: apt.title,
    start: new Date(apt.appointment_time),
    // End time is 1 hour after start by default
    end: new Date(new Date(apt.appointment_time).getTime() + 60 * 60 * 1000),
  }));

  // =============================================
  // eventStyleGetter
  // =============================================
  // Controls the color of each event on the calendar
  // based on its status
  const eventStyleGetter = (event) => {
    let backgroundColor;
    let color;

    switch (event.status) {
      case 'upcoming':
        backgroundColor = '#B5D4F4';
        color = '#0C447C';
        break;
      case 'completed':
        backgroundColor = '#C0DD97';
        color = '#27500A';
        break;
      case 'cancelled':
        backgroundColor = '#F7C1C1';
        color = '#791F1F';
        break;
      default:
        backgroundColor = '#e0e0e0';
        color = '#333';
    }

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 6px'
      }
    };
  };

  // =============================================
  // handleCreate
  // =============================================
  // Creates a new appointment
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        patient_id: user.role === 'patient' ? user.id : formData.patient_id
      };

      await api.post('/appointments', data);
      fetchAppointments();
      setShowForm(false);
      setFormData({
        patient_id: '',
        title: '',
        location: '',
        appointment_time: ''
      });

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create appointment');
    }
  };

  // =============================================
  // handleEdit
  // =============================================
  // Updates an existing appointment
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(
        `/appointments/${selectedAppointment.id}`,
        editData
      );

      // Update the selected appointment with new data
      setSelectedAppointment(response.data.appointment);
      setIsEditing(false);
      fetchAppointments();

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update appointment');
    }
  };

  // =============================================
  // handleCancel
  // =============================================
  // Cancels an appointment
  // A reason is required
  const handleCancel = async (appointmentId) => {
    if (!cancelReason) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      await api.delete(`/appointments/${appointmentId}`, {
        data: { cancel_reason: cancelReason }
      });

      fetchAppointments();
      setSelectedAppointment(null);
      setCancellingId(null);
      setCancelReason('');

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>

      {/* Page header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Appointments</h1>

          {/* Toggle between calendar and list view */}
          <div style={styles.viewToggle}>
            <button
              onClick={() => setView('calendar')}
              style={{
                ...styles.viewBtn,
                ...(view === 'calendar' ? styles.viewBtnActive : {})
              }}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                ...styles.viewBtn,
                ...(view === 'list' ? styles.viewBtnActive : {})
              }}
            >
              List
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.createButton}
        >
          {showForm ? 'Cancel' : '+ New Appointment'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Create appointment form */}
      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Create New Appointment</h2>
          <form onSubmit={handleCreate}>

            {/* Only show patient ID field for caregivers */}
            {user.role === 'caregiver' && (
              <div style={styles.field}>
                <label style={styles.label}>Patient ID</label>
                <input
                  type="text"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={(e) => setFormData({
                    ...formData,
                    patient_id: e.target.value
                  })}
                  style={styles.input}
                  placeholder="Enter patient ID"
                  required
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({
                  ...formData,
                  title: e.target.value
                })}
                style={styles.input}
                placeholder="e.g. Cardiology Checkup"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={(e) => setFormData({
                  ...formData,
                  location: e.target.value
                })}
                style={styles.input}
                placeholder="e.g. Toronto General Hospital"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Date & Time</label>
              <input
                type="datetime-local"
                name="appointment_time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({
                  ...formData,
                  appointment_time: e.target.value
                })}
                style={styles.input}
                required
              />
            </div>

            <button type="submit" style={styles.submitButton}>
              Create Appointment
            </button>
          </form>
        </div>
      )}

      {/* =============================================
          CALENDAR VIEW
          ============================================= */}
      {view === 'calendar' && (
        <div style={styles.calendarContainer}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleEventClick}
            views={['month', 'week', 'day']}
            defaultView="month"
          />

          {/* Color legend */}
          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: '#B5D4F4' }}></span>
              Upcoming
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: '#C0DD97' }}></span>
              Completed
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: '#F7C1C1' }}></span>
              Cancelled
            </span>
          </div>
        </div>
      )}

      {/* =============================================
          LIST VIEW
          ============================================= */}
      {view === 'list' && (
        <div style={styles.list}>
          {appointments.length === 0 ? (
            <div style={styles.empty}>
              <p>No appointments found.</p>
            </div>
          ) : (
            appointments.map(apt => (
              <div
                key={apt.id}
                style={styles.card}
                onClick={() => handleEventClick(apt)}
              >
                <div style={styles.cardHeader}>
                  <h3 style={styles.aptTitle}>{apt.title}</h3>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: apt.status === 'upcoming' ? '#B5D4F4' :
                      apt.status === 'completed' ? '#C0DD97' : '#F7C1C1',
                    color: apt.status === 'upcoming' ? '#0C447C' :
                      apt.status === 'completed' ? '#27500A' : '#791F1F'
                  }}>
                    {apt.status}
                  </span>
                </div>
                <p style={styles.detail}>
                  📅 {formatDate(apt.appointment_time)}
                </p>
                {apt.location && (
                  <p style={styles.detail}>📍 {apt.location}</p>
                )}
                {user.role === 'caregiver' && apt.patient_first_name && (
                  <p style={styles.detail}>
                    👤 {apt.patient_first_name} {apt.patient_last_name}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* =============================================
          APPOINTMENT MODAL
          =============================================
          Shows when an appointment is clicked
          Displays full details, notes, and actions
          ============================================= */}
      {selectedAppointment && (
        // Overlay dims the background
        <div style={styles.overlay} onClick={() => setSelectedAppointment(null)}>

          {/* Modal — stop click from closing when clicking inside */}
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedAppointment.title}</h2>
                <span style={{
                  ...styles.modalBadge,
                  backgroundColor: selectedAppointment.status === 'upcoming' ? '#B5D4F4' :
                    selectedAppointment.status === 'completed' ? '#C0DD97' : '#F7C1C1',
                  color: selectedAppointment.status === 'upcoming' ? '#0C447C' :
                    selectedAppointment.status === 'completed' ? '#27500A' : '#791F1F'
                }}>
                  {selectedAppointment.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div style={styles.modalBody}>

              {/* Show edit form or appointment details */}
              {isEditing ? (
                // Edit form
                <form onSubmit={handleEdit}>
                  <div style={styles.field}>
                    <label style={styles.label}>Title</label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({
                        ...editData,
                        title: e.target.value
                      })}
                      style={styles.input}
                      placeholder={selectedAppointment.title}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Location</label>
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData({
                        ...editData,
                        location: e.target.value
                      })}
                      style={styles.input}
                      placeholder={selectedAppointment.location}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Date & Time</label>
                    <input
                      type="datetime-local"
                      value={editData.appointment_time}
                      onChange={(e) => setEditData({
                        ...editData,
                        appointment_time: e.target.value
                      })}
                      style={styles.input}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" style={styles.submitButton}>
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={styles.backButton}
                    >
                      Cancel
                    </button>
                  </div>
                </form>

              ) : (
                // Appointment details
                <>
                  <div style={styles.modalRow}>
                    <span style={styles.modalIcon}>📅</span>
                    <div>
                      <div style={styles.modalLabel}>Date & time</div>
                      <div style={styles.modalValue}>
                        {formatDate(selectedAppointment.appointment_time)}
                      </div>
                    </div>
                  </div>

                  {selectedAppointment.location && (
                    <div style={styles.modalRow}>
                      <span style={styles.modalIcon}>📍</span>
                      <div>
                        <div style={styles.modalLabel}>Location</div>
                        <div style={styles.modalValue}>
                          {selectedAppointment.location}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show patient name for caregivers */}
                  {user.role === 'caregiver' &&
                    selectedAppointment.patient_first_name && (
                      <div style={styles.modalRow}>
                        <span style={styles.modalIcon}>👤</span>
                        <div>
                          <div style={styles.modalLabel}>Patient</div>
                          <div style={styles.modalValue}>
                            {selectedAppointment.patient_first_name}{' '}
                            {selectedAppointment.patient_last_name}
                          </div>
                        </div>
                      </div>
                    )}

                  <div style={styles.modalRow}>
                    <span style={styles.modalIcon}>✏️</span>
                    <div>
                      <div style={styles.modalLabel}>Created by</div>
                      <div style={styles.modalValue}>
                        {selectedAppointment.created_by_first_name}{' '}
                        {selectedAppointment.created_by_last_name}
                      </div>
                    </div>
                  </div>

                  {/* Show cancel reason if cancelled */}
                  {selectedAppointment.status === 'cancelled' &&
                    selectedAppointment.cancel_reason && (
                      <div style={styles.modalRow}>
                        <span style={styles.modalIcon}>❌</span>
                        <div>
                          <div style={styles.modalLabel}>Cancel reason</div>
                          <div style={{
                            ...styles.modalValue,
                            color: '#791F1F'
                          }}>
                            {selectedAppointment.cancel_reason}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* ── Driver section ── */}
                  <AppointmentDriver appointmentId={selectedAppointment.id} />

                 {/* ── Notes section ── */}
                  <AppointmentNotes appointmentId={selectedAppointment.id} />

                  {/* Cancel form */}
                  {cancellingId === selectedAppointment.id && (
                    <div style={{ marginTop: '1rem' }}>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        style={styles.input}
                        placeholder="Reason for cancellation"
                      />
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        <button
                          onClick={() => handleCancel(selectedAppointment.id)}
                          style={styles.confirmCancelButton}
                        >
                          Confirm Cancel
                        </button>
                        <button
                          onClick={() => {
                            setCancellingId(null);
                            setCancelReason('');
                          }}
                          style={styles.backButton}
                        >
                          Go Back
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal footer — action buttons */}
            {!isEditing && selectedAppointment.status === 'upcoming' && (
              <div style={styles.modalFooter}>
                {cancellingId !== selectedAppointment.id && (
                  <>
                    <button
                      onClick={() => setCancellingId(selectedAppointment.id)}
                      style={styles.cancelButton}
                    >
                      Cancel Appointment
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditData({
                          title: selectedAppointment.title,
                          location: selectedAppointment.location || '',
                          appointment_time: ''
                        });
                      }}
                      style={styles.editButton}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
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
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  title: {
    color: '#333',
    margin: 0
  },
  viewToggle: {
    display: 'flex',
    border: '1px solid #ddd',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  viewBtn: {
    padding: '6px 16px',
    border: 'none',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#666'
  },
  viewBtnActive: {
    background: '#1976d2',
    color: 'white'
  },
  createButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  formCard: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem'
  },
  formTitle: {
    color: '#333',
    marginBottom: '1rem'
  },
  field: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },
  submitButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  calendarContainer: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem'
  },
  legend: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1rem',
    fontSize: '13px',
    color: '#666'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    display: 'inline-block'
  },
  list: {
    display: 'grid',
    gap: '1rem'
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    color: '#666'
  },
  card: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  aptTitle: {
    color: '#333',
    margin: 0
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  detail: {
    color: '#666',
    margin: '0.25rem 0',
    fontSize: '0.9rem'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalHeader: {
    padding: '1.25rem',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  modalTitle: {
    color: '#333',
    marginBottom: '0.5rem',
    fontSize: '1.2rem'
  },
  modalBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0'
  },
  modalBody: {
    padding: '1.25rem'
  },
  modalRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
    alignItems: 'flex-start'
  },
  modalIcon: {
    fontSize: '16px',
    width: '20px',
    flexShrink: 0,
    marginTop: '2px'
  },
  modalLabel: {
    fontSize: '11px',
    color: '#666',
    marginBottom: '2px'
  },
  modalValue: {
    fontSize: '14px',
    color: '#333'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '1rem 0'
  },
  notesTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '8px'
  },
  noNotes: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic'
  },
  noteItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '8px'
  },
  noteContent: {
    fontSize: '13px',
    color: '#333',
    marginBottom: '4px'
  },
  noteMeta: {
    fontSize: '11px',
    color: '#999'
  },
  modalFooter: {
    padding: '1rem 1.25rem',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    backgroundColor: 'transparent',
    color: '#c62828',
    border: '1px solid #c62828',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  editButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  confirmCancelButton: {
    backgroundColor: '#c62828',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  backButton: {
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666'
  }
};

export default Appointments;