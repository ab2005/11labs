import { useState, useEffect, useCallback } from 'react';
import { GoogleCalendarAPI } from '../services/GoogleCalendarAPI.js';
import { authService } from '../services/AuthService.js';
import { formatEventForDisplay } from '../utils/eventUtils.js';
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  COMPONENT_STATES 
} from '../utils/constants.js';

/**
 * Custom hook for Google Calendar operations
 * @returns {object} Calendar operations and state
 */
export const useGoogleCalendar = () => {
  const [calendarAPI, setCalendarAPI] = useState(null);
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize calendar API
  useEffect(() => {
    const initializeAPI = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setIsAuthenticated(false);
          setCalendarAPI(null);
          return;
        }

        const accessToken = await authService.getValidAccessToken();
        const api = new GoogleCalendarAPI(accessToken);
        setCalendarAPI(api);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error initializing calendar API:', err);
        setError(err.message);
        setIsAuthenticated(false);
      }
    };

    initializeAPI();
  }, []);

  /**
   * Creates a new calendar event
   * @param {object} eventData - Event data
   * @returns {Promise<object>} Created event
   */
  const createEvent = useCallback(async (eventData) => {
    if (!calendarAPI) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      setLoading(true);
      setError(null);
      
      const event = await calendarAPI.createEvent(eventData);
      const formattedEvent = formatEventForDisplay(event);
      
      // Add to local state
      setEvents(prev => [...prev, formattedEvent]);
      
      return formattedEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarAPI]);

  /**
   * Lists calendar events
   * @param {object} options - Query options
   * @returns {Promise<array>} Array of events
   */
  const listEvents = useCallback(async (options = {}) => {
    if (!calendarAPI) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      setLoading(true);
      setError(null);
      
      const eventList = await calendarAPI.listEvents(options);
      const formattedEvents = eventList.map(formatEventForDisplay);
      
      setEvents(formattedEvents);
      return formattedEvents;
    } catch (err) {
      console.error('Error listing events:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarAPI]);

  /**
   * Gets a specific event
   * @param {string} eventId - Event ID
   * @returns {Promise<object>} Event object
   */
  const getEvent = useCallback(async (eventId) => {
    if (!calendarAPI) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      setLoading(true);
      setError(null);
      
      const event = await calendarAPI.getEvent(eventId);
      return formatEventForDisplay(event);
    } catch (err) {
      console.error('Error getting event:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarAPI]);

  /**
   * Updates an existing event
   * @param {string} eventId - Event ID
   * @param {object} eventData - Updated event data
   * @returns {Promise<object>} Updated event
   */
  const updateEvent = useCallback(async (eventId, eventData) => {
    if (!calendarAPI) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      setLoading(true);
      setError(null);
      
      const event = await calendarAPI.updateEvent(eventId, eventData);
      const formattedEvent = formatEventForDisplay(event);
      
      // Update local state
      setEvents(prev => prev.map(e => 
        e.id === eventId ? formattedEvent : e
      ));
      
      return formattedEvent;
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarAPI]);

  /**
   * Deletes an event
   * @param {string} eventId - Event ID
   * @returns {Promise<void>}
   */
  const deleteEvent = useCallback(async (eventId) => {
    if (!calendarAPI) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      setLoading(true);
      setError(null);
      
      await calendarAPI.deleteEvent(eventId);
      
      // Remove from local state
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarAPI]);

  /**
   * Lists available calendars
   * @returns {Promise<array>} Array of calendars
   */
  const listCalendars = useCallback(async () => {
    if (!calendarAPI) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      setLoading(true);
      setError(null);
      
      const calendarList = await calendarAPI.listCalendars();
      setCalendars(calendarList);
      return calendarList;
    } catch (err) {
      console.error('Error listing calendars:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarAPI]);

  /**
   * Searches for events
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<array>} Array of matching events
   */
  const searchEvents = useCallback(async (query, options = {}) => {
    if (!calendarAPI) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      setLoading(true);
      setError(null);
      
      const eventList = await calendarAPI.searchEvents(query, options);
      const formattedEvents = eventList.map(formatEventForDisplay);
      
      return formattedEvents;
    } catch (err) {
      console.error('Error searching events:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarAPI]);

  /**
   * Gets free/busy information
   * @param {object} options - Free/busy options
   * @returns {Promise<object>} Free/busy data
   */
  const getFreeBusy = useCallback(async (options = {}) => {
    if (!calendarAPI) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      setLoading(true);
      setError(null);
      
      const freeBusyData = await calendarAPI.getFreeBusy(options);
      return freeBusyData;
    } catch (err) {
      console.error('Error getting free/busy info:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarAPI]);

  /**
   * Refreshes the current event list
   * @param {object} options - Refresh options
   * @returns {Promise<void>}
   */
  const refreshEvents = useCallback(async (options = {}) => {
    await listEvents(options);
  }, [listEvents]);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clears events state
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    // State
    events,
    calendars,
    loading,
    error,
    isAuthenticated,
    
    // Actions
    createEvent,
    listEvents,
    getEvent,
    updateEvent,
    deleteEvent,
    listCalendars,
    searchEvents,
    getFreeBusy,
    refreshEvents,
    clearError,
    clearEvents,
    
    // Computed values
    hasEvents: events.length > 0,
    eventCount: events.length,
    state: loading ? COMPONENT_STATES.LOADING : 
           error ? COMPONENT_STATES.ERROR :
           events.length === 0 ? COMPONENT_STATES.EMPTY :
           COMPONENT_STATES.LOADED
  };
};

export default useGoogleCalendar;