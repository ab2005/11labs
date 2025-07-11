import React, { useState, useEffect } from 'react';
import CalendarAuth from './CalendarAuth.js';
import CalendarEventForm from './CalendarEventForm.js';
import CalendarEventList from './CalendarEventList.js';
import useGoogleCalendar from '../hooks/useGoogleCalendar.js';
import useElevenLabsTools from '../hooks/useElevenLabsTools.js';
import { 
  COMPONENT_STATES, 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES 
} from '../utils/constants.js';

const GoogleCalendarTool = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [notification, setNotification] = useState(null);
  
  const {
    events,
    loading: calendarLoading,
    error: calendarError,
    createEvent,
    listEvents,
    updateEvent,
    deleteEvent,
    refreshEvents,
    clearError: clearCalendarError,
    eventCount,
    state: calendarState
  } = useGoogleCalendar();
  
  const {
    isInitialized: toolsInitialized,
    isLoading: toolsLoading,
    error: toolsError,
    lastResponse,
    toolCallHistory,
    createEvent: toolCreateEvent,
    listEvents: toolListEvents,
    updateEvent: toolUpdateEvent,
    deleteEvent: toolDeleteEvent,
    clearError: clearToolsError,
    clearHistory,
    getStats,
    isReady: toolsReady
  } = useElevenLabsTools();

  // Initialize events when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialEvents();
    }
  }, [isAuthenticated]);

  // Show notifications for tool responses
  useEffect(() => {
    if (lastResponse) {
      showNotification(
        lastResponse.success ? 'success' : 'error',
        lastResponse.message
      );
    }
  }, [lastResponse]);

  const loadInitialEvents = async () => {
    try {
      await listEvents();
    } catch (error) {
      console.error('Error loading initial events:', error);
    }
  };

  const handleAuthChange = (authenticated, userInfo) => {
    setIsAuthenticated(authenticated);
    setUser(userInfo);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await createEvent(eventData);
      showNotification('success', SUCCESS_MESSAGES.EVENT_CREATED);
      await refreshEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      showNotification('error', `Failed to create event: ${error.message}`);
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      await updateEvent(eventId, eventData);
      showNotification('success', SUCCESS_MESSAGES.EVENT_UPDATED);
      await refreshEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      showNotification('error', `Failed to update event: ${error.message}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      showNotification('success', SUCCESS_MESSAGES.EVENT_DELETED);
      await refreshEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification('error', `Failed to delete event: ${error.message}`);
    }
  };

  const handleRefreshEvents = async () => {
    try {
      await refreshEvents();
      showNotification('success', SUCCESS_MESSAGES.EVENTS_LOADED);
    } catch (error) {
      console.error('Error refreshing events:', error);
      showNotification('error', `Failed to refresh events: ${error.message}`);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const clearAllErrors = () => {
    clearCalendarError();
    clearToolsError();
  };

  const toolStats = getStats();

  if (!isAuthenticated) {
    return (
      <div className="calendar-tool">
        <div className="tool-header">
          <h1>Google Calendar Tool</h1>
          <p>ElevenLabs Integration for Calendar Management</p>
        </div>
        <CalendarAuth onAuthChange={handleAuthChange} />
      </div>
    );
  }

  return (
    <div className="calendar-tool">
      <div className="tool-header">
        <h1>Google Calendar Tool</h1>
        <div className="header-info">
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <span className="status-indicator" title="Connected to Google Calendar">
              ✅
            </span>
          </div>
          <div className="tool-status">
            <span>ElevenLabs Tools: </span>
            <span className={`status ${toolsReady ? 'ready' : 'loading'}`}>
              {toolsReady ? 'Ready' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      <CalendarAuth onAuthChange={handleAuthChange} />

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Error Messages */}
      {(calendarError || toolsError) && (
        <div className="error-container">
          {calendarError && (
            <div className="error-message">
              <strong>Calendar Error:</strong> {calendarError}
            </div>
          )}
          {toolsError && (
            <div className="error-message">
              <strong>Tools Error:</strong> {toolsError}
            </div>
          )}
          <button onClick={clearAllErrors} className="clear-errors">
            Clear Errors
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events ({eventCount})
        </button>
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Event
        </button>
        <button 
          className={`tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          Tool History ({toolStats.total})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'events' && (
          <div className="events-tab">
            <div className="events-header">
              <h2>Calendar Events</h2>
              <button 
                onClick={handleRefreshEvents}
                disabled={calendarLoading}
                className="refresh-button"
              >
                {calendarLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <CalendarEventList
              events={events}
              loading={calendarLoading}
              state={calendarState}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-tab">
            <h2>Create New Event</h2>
            <CalendarEventForm
              onSubmit={handleCreateEvent}
              loading={calendarLoading}
            />
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="tools-tab">
            <div className="tools-header">
              <h2>ElevenLabs Tool History</h2>
              <div className="tools-stats">
                <div className="stat">
                  <label>Total Calls:</label>
                  <span>{toolStats.total}</span>
                </div>
                <div className="stat">
                  <label>Success Rate:</label>
                  <span>{toolStats.successRate}%</span>
                </div>
                <div className="stat">
                  <label>Last Call:</label>
                  <span>{toolStats.lastCall ? new Date(toolStats.lastCall).toLocaleString() : 'None'}</span>
                </div>
              </div>
              <button 
                onClick={clearHistory}
                className="clear-history"
                disabled={toolCallHistory.length === 0}
              >
                Clear History
              </button>
            </div>
            
            <div className="tool-history">
              {toolCallHistory.length === 0 ? (
                <div className="empty-state">
                  <p>No tool calls yet. Tool calls will appear here when the ElevenLabs agent uses calendar functions.</p>
                </div>
              ) : (
                <div className="history-list">
                  {toolCallHistory.map((entry) => (
                    <div key={entry.id} className={`history-item ${entry.success ? 'success' : 'error'}`}>
                      <div className="history-header">
                        <span className="tool-name">{entry.toolName}</span>
                        <span className="timestamp">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className={`status ${entry.success ? 'success' : 'error'}`}>
                          {entry.success ? '✅' : '❌'}
                        </span>
                      </div>
                      <div className="history-details">
                        <div className="parameters">
                          <strong>Parameters:</strong>
                          <pre>{JSON.stringify(entry.parameters, null, 2)}</pre>
                        </div>
                        <div className="response">
                          <strong>Response:</strong>
                          <p>{entry.response.message}</p>
                          {entry.response.data && (
                            <pre>{JSON.stringify(entry.response.data, null, 2)}</pre>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .calendar-tool {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .tool-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .tool-header h1 {
          color: #333;
          margin: 0 0 10px 0;
        }

        .header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-indicator {
          font-size: 16px;
        }

        .tool-status {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .status {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status.ready {
          background: #d4edda;
          color: #155724;
        }

        .status.loading {
          background: #fff3cd;
          color: #856404;
        }

        .notification {
          padding: 12px;
          margin-bottom: 20px;
          border-radius: 4px;
          font-weight: 500;
        }

        .notification.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .notification.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .error-container {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .error-message {
          color: #721c24;
          margin-bottom: 10px;
        }

        .clear-errors {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 2px solid #e9ecef;
          margin-bottom: 20px;
        }

        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          color: #6c757d;
          border-bottom: 2px solid transparent;
        }

        .tab.active {
          color: #4285f4;
          border-bottom-color: #4285f4;
        }

        .tab:hover {
          color: #333;
        }

        .events-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .refresh-button {
          background: #4285f4;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        .refresh-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .tools-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .tools-stats {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat label {
          font-size: 12px;
          color: #666;
        }

        .stat span {
          font-weight: 500;
          color: #333;
        }

        .clear-history {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .clear-history:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .history-item {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
        }

        .history-item.success {
          border-left: 4px solid #28a745;
        }

        .history-item.error {
          border-left: 4px solid #dc3545;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .tool-name {
          font-weight: 500;
          color: #333;
        }

        .timestamp {
          font-size: 12px;
          color: #666;
        }

        .history-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .parameters pre,
        .response pre {
          background: #f1f3f4;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .header-info {
            flex-direction: column;
            gap: 10px;
          }

          .tools-header {
            flex-direction: column;
            align-items: stretch;
          }

          .tools-stats {
            justify-content: center;
          }

          .history-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GoogleCalendarTool;