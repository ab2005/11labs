import { google } from 'googleapis';
import { 
  GOOGLE_CALENDAR_CONFIG, 
  DEFAULTS, 
  ERROR_MESSAGES, 
  STORAGE_KEYS 
} from '../utils/constants.js';
import { createDateRange } from '../utils/dateUtils.js';
import { validateEventData, convertToGoogleCalendarEvent } from '../utils/eventUtils.js';

/**
 * Google Calendar API wrapper class
 */
export class GoogleCalendarAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.auth = new google.auth.OAuth2();
    this.auth.setCredentials({ access_token: accessToken });
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  /**
   * Creates a new calendar event
   * @param {object} eventData - Event data object
   * @param {string} calendarId - Calendar ID (defaults to primary)
   * @returns {Promise<object>} Created event object
   */
  async createEvent(eventData, calendarId = DEFAULTS.CALENDAR_ID) {
    try {
      const validation = validateEventData(eventData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const event = convertToGoogleCalendarEvent(eventData);
      
      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
        sendNotifications: true
      });

      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Lists calendar events
   * @param {object} options - Query options
   * @returns {Promise<array>} Array of events
   */
  async listEvents(options = {}) {
    try {
      const {
        calendarId = DEFAULTS.CALENDAR_ID,
        timeMin,
        timeMax,
        maxResults = DEFAULTS.MAX_RESULTS,
        singleEvents = true,
        orderBy = 'startTime',
        q = null
      } = options;

      const dateRange = createDateRange(timeMin, timeMax);
      
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: dateRange.timeMin,
        timeMax: dateRange.timeMax,
        maxResults,
        singleEvents,
        orderBy,
        q
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error listing events:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Gets a specific calendar event
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID (defaults to primary)
   * @returns {Promise<object>} Event object
   */
  async getEvent(eventId, calendarId = DEFAULTS.CALENDAR_ID) {
    try {
      if (!eventId) {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
      }

      const response = await this.calendar.events.get({
        calendarId,
        eventId
      });

      return response.data;
    } catch (error) {
      console.error('Error getting event:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Updates a calendar event
   * @param {string} eventId - Event ID
   * @param {object} eventData - Updated event data
   * @param {string} calendarId - Calendar ID (defaults to primary)
   * @returns {Promise<object>} Updated event object
   */
  async updateEvent(eventId, eventData, calendarId = DEFAULTS.CALENDAR_ID) {
    try {
      if (!eventId) {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
      }

      // Get existing event first
      const existingEvent = await this.getEvent(eventId, calendarId);
      
      // Merge with new data
      const updatedEvent = {
        ...existingEvent,
        ...convertToGoogleCalendarEvent(eventData)
      };

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: updatedEvent,
        sendNotifications: true
      });

      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Deletes a calendar event
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID (defaults to primary)
   * @returns {Promise<void>}
   */
  async deleteEvent(eventId, calendarId = DEFAULTS.CALENDAR_ID) {
    try {
      if (!eventId) {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
      }

      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendNotifications: true
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Lists available calendars
   * @returns {Promise<array>} Array of calendar objects
   */
  async listCalendars() {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error listing calendars:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Gets calendar metadata
   * @param {string} calendarId - Calendar ID
   * @returns {Promise<object>} Calendar object
   */
  async getCalendar(calendarId) {
    try {
      const response = await this.calendar.calendars.get({
        calendarId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting calendar:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Searches for events
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<array>} Array of matching events
   */
  async searchEvents(query, options = {}) {
    try {
      const {
        calendarId = DEFAULTS.CALENDAR_ID,
        maxResults = DEFAULTS.MAX_RESULTS,
        timeMin,
        timeMax
      } = options;

      const dateRange = createDateRange(timeMin, timeMax);
      
      const response = await this.calendar.events.list({
        calendarId,
        q: query,
        timeMin: dateRange.timeMin,
        timeMax: dateRange.timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error searching events:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Gets free/busy information
   * @param {object} options - Free/busy query options
   * @returns {Promise<object>} Free/busy information
   */
  async getFreeBusy(options = {}) {
    try {
      const {
        calendarIds = [DEFAULTS.CALENDAR_ID],
        timeMin,
        timeMax
      } = options;

      const dateRange = createDateRange(timeMin, timeMax);
      
      const response = await this.calendar.freebusy.query({
        resource: {
          timeMin: dateRange.timeMin,
          timeMax: dateRange.timeMax,
          items: calendarIds.map(id => ({ id }))
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting free/busy info:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Handles API errors and converts them to user-friendly messages
   * @param {Error} error - Original error
   * @returns {Error} Processed error
   */
  handleAPIError(error) {
    console.error('API Error:', error);
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          return new Error(ERROR_MESSAGES.AUTH_REQUIRED);
        case 403:
          return new Error(ERROR_MESSAGES.PERMISSION_DENIED);
        case 404:
          return new Error(ERROR_MESSAGES.EVENT_NOT_FOUND);
        case 400:
          return new Error(data.error?.message || ERROR_MESSAGES.API_ERROR);
        default:
          return new Error(`${ERROR_MESSAGES.API_ERROR} (${status})`);
      }
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    return new Error(error.message || ERROR_MESSAGES.API_ERROR);
  }

  /**
   * Checks if the API is properly authenticated
   * @returns {Promise<boolean>} True if authenticated
   */
  async isAuthenticated() {
    try {
      await this.calendar.calendarList.list({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Gets the user's profile information
   * @returns {Promise<object>} User profile
   */
  async getUserProfile() {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.auth });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw this.handleAPIError(error);
    }
  }
}

/**
 * Factory function to create GoogleCalendarAPI instance
 * @param {string} accessToken - OAuth access token
 * @returns {GoogleCalendarAPI} API instance
 */
export const createGoogleCalendarAPI = (accessToken) => {
  if (!accessToken) {
    throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
  }
  return new GoogleCalendarAPI(accessToken);
};

/**
 * Gets stored access token from localStorage
 * @returns {string|null} Access token or null if not found
 */
export const getStoredAccessToken = () => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    if (!token || !expiry) {
      return null;
    }
    
    // Check if token is expired
    const expiryDate = new Date(expiry);
    if (expiryDate <= new Date()) {
      console.warn('Access token expired');
      clearStoredTokens();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting stored access token:', error);
    return null;
  }
};

/**
 * Stores access token in localStorage
 * @param {string} accessToken - OAuth access token
 * @param {string} refreshToken - OAuth refresh token
 * @param {number} expiresIn - Token expiry time in seconds
 */
export const storeAccessToken = (accessToken, refreshToken, expiresIn) => {
  try {
    const expiryDate = new Date(Date.now() + (expiresIn * 1000));
    
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryDate.toISOString());
    
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  } catch (error) {
    console.error('Error storing access token:', error);
  }
};

/**
 * Clears stored tokens from localStorage
 */
export const clearStoredTokens = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  } catch (error) {
    console.error('Error clearing stored tokens:', error);
  }
};

export default GoogleCalendarAPI;