import React, { useState } from 'react';
import { formatForDisplay } from '../utils/dateUtils.js';
import { isEventInPast, isEventHappening } from '../utils/dateUtils.js';
import { COMPONENT_STATES } from '../utils/constants.js';

const CalendarEventList = ({ 
  events = [], 
  loading = false, 
  state = COMPONENT_STATES.LOADED,
  onUpdateEvent,
  onDeleteEvent 
}) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const [editingEvent, setEditingEvent] = useState(null);

  const toggleDetails = (eventId) => {
    setShowDetails(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await onDeleteEvent(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const getEventStatus = (event) => {
    if (isEventHappening(event.start, event.end)) {
      return 'happening';
    }
    if (isEventInPast(event.end)) {
      return 'past';
    }
    return 'upcoming';
  };

  const formatEventTime = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${formatForDisplay(start, 'MMM d, yyyy')} • ${formatForDisplay(start, 'h:mm a')} - ${formatForDisplay(end, 'h:mm a')}`;
    }
    
    return `${formatForDisplay(start)} - ${formatForDisplay(end)}`;
  };

  if (loading) {
    return (
      <div className="event-list loading">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  if (state === COMPONENT_STATES.ERROR) {
    return (
      <div className="event-list error">
        <p>Error loading events. Please try again.</p>
      </div>
    );
  }

  if (state === COMPONENT_STATES.EMPTY || events.length === 0) {
    return (
      <div className="event-list empty">
        <div className="empty-state">
          <h3>No events found</h3>
          <p>You don't have any calendar events yet. Create your first event to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-list">
      <div className="events-container">
        {events.map((event) => {
          const status = getEventStatus(event);
          const isDetailsOpen = showDetails[event.id];
          
          return (
            <div key={event.id} className={`event-card ${status}`}>
              <div className="event-header" onClick={() => toggleDetails(event.id)}>
                <div className="event-title-section">
                  <h3 className="event-title">{event.title}</h3>
                  <div className="event-time">{formatEventTime(event.start, event.end)}</div>
                </div>
                <div className="event-actions">
                  <span className={`status-badge ${status}`}>
                    {status === 'happening' ? 'Now' : 
                     status === 'past' ? 'Past' : 'Upcoming'}
                  </span>
                  <button 
                    className="expand-button"
                    title={isDetailsOpen ? 'Hide details' : 'Show details'}
                  >
                    {isDetailsOpen ? '−' : '+'}
                  </button>
                </div>
              </div>

              {isDetailsOpen && (
                <div className="event-details">
                  <div className="details-grid">
                    {event.description && (
                      <div className="detail-item">
                        <label>Description:</label>
                        <p>{event.description}</p>
                      </div>
                    )}
                    
                    {event.location && (
                      <div className="detail-item">
                        <label>Location:</label>
                        <p>{event.location}</p>
                      </div>
                    )}
                    
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="detail-item">
                        <label>Attendees ({event.attendees.length}):</label>
                        <div className="attendees-list">
                          {event.attendees.map((attendee, index) => (
                            <span key={index} className="attendee">{attendee}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="detail-item">
                      <label>Status:</label>
                      <p className={`event-status ${event.status}`}>{event.status}</p>
                    </div>
                    
                    {event.htmlLink && (
                      <div className="detail-item">
                        <label>Google Calendar:</label>
                        <a 
                          href={event.htmlLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="calendar-link"
                        >
                          Open in Google Calendar
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="event-controls">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditEvent(event)}
                      disabled={status === 'past'}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .event-list {
          width: 100%;
        }

        .event-list.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4285f4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .event-list.error {
          text-align: center;
          padding: 40px;
          color: #dc3545;
        }

        .event-list.empty {
          text-align: center;
          padding: 40px;
        }

        .empty-state h3 {
          color: #666;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #999;
        }

        .events-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .event-card {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: white;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }

        .event-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .event-card.happening {
          border-left: 4px solid #28a745;
        }

        .event-card.past {
          border-left: 4px solid #6c757d;
          opacity: 0.8;
        }

        .event-card.upcoming {
          border-left: 4px solid #4285f4;
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          cursor: pointer;
          background: #f8f9fa;
        }

        .event-header:hover {
          background: #e9ecef;
        }

        .event-title-section {
          flex: 1;
        }

        .event-title {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 16px;
          font-weight: 500;
        }

        .event-time {
          font-size: 14px;
          color: #666;
        }

        .event-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.happening {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.past {
          background: #f8f9fa;
          color: #6c757d;
        }

        .status-badge.upcoming {
          background: #d1ecf1;
          color: #0c5460;
        }

        .expand-button {
          width: 24px;
          height: 24px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }

        .expand-button:hover {
          background: #f8f9fa;
        }

        .event-details {
          padding: 15px;
          border-top: 1px solid #e9ecef;
        }

        .details-grid {
          display: grid;
          gap: 15px;
          margin-bottom: 15px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .detail-item label {
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .detail-item p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .attendees-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .attendee {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          color: #333;
        }

        .event-status {
          text-transform: capitalize;
        }

        .event-status.confirmed {
          color: #28a745;
        }

        .event-status.tentative {
          color: #ffc107;
        }

        .event-status.cancelled {
          color: #dc3545;
        }

        .calendar-link {
          color: #4285f4;
          text-decoration: none;
        }

        .calendar-link:hover {
          text-decoration: underline;
        }

        .event-controls {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding-top: 15px;
          border-top: 1px solid #e9ecef;
        }

        .edit-button, .delete-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .edit-button {
          background: #4285f4;
          color: white;
          border-color: #4285f4;
        }

        .edit-button:hover:not(:disabled) {
          background: #357ae8;
        }

        .edit-button:disabled {
          background: #ccc;
          border-color: #ccc;
          cursor: not-allowed;
        }

        .delete-button {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .delete-button:hover {
          background: #c82333;
        }

        @media (max-width: 600px) {
          .event-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .event-actions {
            align-self: flex-end;
          }

          .event-controls {
            flex-direction: column;
          }

          .edit-button, .delete-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarEventList;