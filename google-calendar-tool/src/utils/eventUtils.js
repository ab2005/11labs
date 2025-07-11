import { parseISO, isValid } from 'date-fns';
import { 
  EVENT_STATUS, 
  DEFAULTS, 
  ERROR_MESSAGES, 
  ELEVENLABS_TOOLS,
  EVENT_ACTIONS,
  DEFAULT_REMINDERS 
} from './constants.js';
import { formatToISO, isValidISODate, createGoogleDateTime, addDuration } from './dateUtils.js';

/**
 * Validates event data for creation/update
 * @param {object} eventData - Event data object
 * @returns {object} Validation result with isValid and errors
 */
export const validateEventData = (eventData) => {
  const errors = [];
  
  // Required fields
  if (!eventData.summary || typeof eventData.summary !== 'string') {
    errors.push(`${ERROR_MESSAGES.MISSING_REQUIRED_FIELD}summary`);
  }
  
  if (!eventData.start_datetime || !isValidISODate(eventData.start_datetime)) {
    errors.push(`${ERROR_MESSAGES.MISSING_REQUIRED_FIELD}start_datetime (valid ISO format)`);
  }
  
  if (!eventData.end_datetime || !isValidISODate(eventData.end_datetime)) {
    errors.push(`${ERROR_MESSAGES.MISSING_REQUIRED_FIELD}end_datetime (valid ISO format)`);
  }
  
  // Validate end time is after start time
  if (eventData.start_datetime && eventData.end_datetime) {
    const startDate = parseISO(eventData.start_datetime);
    const endDate = parseISO(eventData.end_datetime);
    
    if (isValid(startDate) && isValid(endDate) && endDate <= startDate) {
      errors.push('End time must be after start time');
    }
  }
  
  // Validate optional fields
  if (eventData.attendees && typeof eventData.attendees !== 'string') {
    errors.push('Attendees must be a comma-separated string of email addresses');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Converts ElevenLabs tool parameters to Google Calendar event format
 * @param {object} toolParams - Parameters from ElevenLabs tool call
 * @returns {object} Google Calendar event object
 */
export const convertToGoogleCalendarEvent = (toolParams) => {
  try {
    const validation = validateEventData(toolParams);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    const event = {
      summary: toolParams.summary,
      start: createGoogleDateTime(toolParams.start_datetime),
      end: createGoogleDateTime(toolParams.end_datetime),
      status: EVENT_STATUS.CONFIRMED
    };
    
    // Optional fields
    if (toolParams.description) {
      event.description = toolParams.description;
    }
    
    if (toolParams.location) {
      event.location = toolParams.location;
    }
    
    // Parse attendees
    if (toolParams.attendees) {
      event.attendees = parseAttendees(toolParams.attendees);
    }
    
    // Add default reminders
    event.reminders = {
      useDefault: false,
      overrides: DEFAULT_REMINDERS
    };
    
    return event;
  } catch (error) {
    console.error('Error converting to Google Calendar event:', error);
    throw error;
  }
};

/**
 * Parses comma-separated attendee emails
 * @param {string} attendeesString - Comma-separated email addresses
 * @returns {array} Array of attendee objects
 */
export const parseAttendees = (attendeesString) => {
  try {
    if (!attendeesString || typeof attendeesString !== 'string') {
      return [];
    }
    
    return attendeesString
      .split(',')
      .map(email => email.trim())
      .filter(email => isValidEmail(email))
      .map(email => ({ email }));
  } catch (error) {
    console.error('Error parsing attendees:', error);
    return [];
  }
};

/**
 * Validates email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formats Google Calendar event for display
 * @param {object} event - Google Calendar event object
 * @returns {object} Formatted event object
 */
export const formatEventForDisplay = (event) => {
  try {
    return {
      id: event.id,
      title: event.summary || 'Untitled Event',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description || '',
      location: event.location || '',
      attendees: event.attendees?.map(a => a.email) || [],
      status: event.status || EVENT_STATUS.CONFIRMED,
      created: event.created,
      updated: event.updated,
      htmlLink: event.htmlLink,
      hangoutLink: event.hangoutLink,
      isAllDay: !event.start?.dateTime, // If no dateTime, it's all-day
      creator: event.creator?.email || '',
      organizer: event.organizer?.email || ''
    };
  } catch (error) {
    console.error('Error formatting event for display:', error);
    return {
      id: event.id || 'unknown',
      title: 'Error loading event',
      start: null,
      end: null,
      description: '',
      location: '',
      attendees: [],
      status: EVENT_STATUS.CANCELLED
    };
  }
};

/**
 * Creates quick event from natural language input
 * @param {string} input - Natural language input (e.g., "Meeting tomorrow at 3pm")
 * @returns {object} Event object or null if parsing fails
 */
export const createQuickEvent = (input) => {
  try {
    // This is a simplified parser - in production you might want to use a more sophisticated NLP library
    const words = input.toLowerCase().split(' ');
    const event = {
      summary: '',
      start_datetime: '',
      end_datetime: ''
    };
    
    // Extract time patterns
    const timePattern = /(\d{1,2})(:\d{2})?\s*(am|pm)?/i;
    const timeMatch = input.match(timePattern);
    
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2].substring(1)) : 0;
      const ampm = timeMatch[3]?.toLowerCase();
      
      let adjustedHour = hour;
      if (ampm === 'pm' && hour !== 12) adjustedHour += 12;
      if (ampm === 'am' && hour === 12) adjustedHour = 0;
      
      const now = new Date();
      const eventDate = new Date(now);
      
      // Handle "tomorrow", "today", etc.
      if (input.includes('tomorrow')) {
        eventDate.setDate(eventDate.getDate() + 1);
      }
      
      eventDate.setHours(adjustedHour, minute, 0, 0);
      
      event.start_datetime = formatToISO(eventDate);
      event.end_datetime = addDuration(event.start_datetime, DEFAULTS.EVENT_DURATION_MINUTES);
      
      // Extract title (everything before time-related words)
      const timeWords = ['at', 'tomorrow', 'today', 'on', timeMatch[0]];
      event.summary = input.split(' ')
        .filter(word => !timeWords.some(tw => word.toLowerCase().includes(tw.toLowerCase())))
        .join(' ')
        .trim() || 'Quick Event';
      
      return event;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating quick event:', error);
    return null;
  }
};

/**
 * Validates tool call parameters
 * @param {string} toolName - Name of the tool
 * @param {object} parameters - Tool parameters
 * @returns {object} Validation result
 */
export const validateToolCall = (toolName, parameters) => {
  const errors = [];
  
  if (!Object.values(ELEVENLABS_TOOLS).includes(toolName)) {
    errors.push(`${ERROR_MESSAGES.INVALID_TOOL_NAME}: ${toolName}`);
  }
  
  switch (toolName) {
    case ELEVENLABS_TOOLS.CREATE_EVENT:
      const createValidation = validateEventData(parameters);
      if (!createValidation.isValid) {
        errors.push(...createValidation.errors);
      }
      break;
      
    case ELEVENLABS_TOOLS.LIST_EVENTS:
      // Optional parameters, validate if provided
      if (parameters.start_date && !isValidISODate(parameters.start_date)) {
        errors.push('Invalid start_date format');
      }
      if (parameters.end_date && !isValidISODate(parameters.end_date)) {
        errors.push('Invalid end_date format');
      }
      if (parameters.max_results && (!Number.isInteger(parameters.max_results) || parameters.max_results < 1)) {
        errors.push('max_results must be a positive integer');
      }
      break;
      
    case ELEVENLABS_TOOLS.MANAGE_EVENT:
      if (!parameters.event_id) {
        errors.push(`${ERROR_MESSAGES.MISSING_REQUIRED_FIELD}event_id`);
      }
      if (!parameters.action || !Object.values(EVENT_ACTIONS).includes(parameters.action)) {
        errors.push(`${ERROR_MESSAGES.MISSING_REQUIRED_FIELD}action (update or delete)`);
      }
      if (parameters.action === EVENT_ACTIONS.UPDATE) {
        // At least one field should be provided for update
        const updateFields = ['summary', 'start_datetime', 'end_datetime', 'description', 'location'];
        if (!updateFields.some(field => parameters[field])) {
          errors.push('At least one field must be provided for update');
        }
      }
      break;
      
    default:
      errors.push(`Unknown tool: ${toolName}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Creates a tool response for ElevenLabs
 * @param {boolean} success - Whether the operation was successful
 * @param {any} data - Response data
 * @param {string} message - Response message
 * @returns {object} Tool response object
 */
export const createToolResponse = (success, data = null, message = '') => {
  return {
    success,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Extracts event conflicts from a list of events
 * @param {array} events - List of events
 * @param {object} newEvent - New event to check conflicts against
 * @returns {array} Array of conflicting events
 */
export const findEventConflicts = (events, newEvent) => {
  try {
    const newStart = parseISO(newEvent.start_datetime);
    const newEnd = parseISO(newEvent.end_datetime);
    
    if (!isValid(newStart) || !isValid(newEnd)) {
      return [];
    }
    
    return events.filter(event => {
      const eventStart = parseISO(event.start?.dateTime || event.start?.date);
      const eventEnd = parseISO(event.end?.dateTime || event.end?.date);
      
      if (!isValid(eventStart) || !isValid(eventEnd)) {
        return false;
      }
      
      // Check for overlap
      return (newStart < eventEnd && newEnd > eventStart);
    });
  } catch (error) {
    console.error('Error finding event conflicts:', error);
    return [];
  }
};

/**
 * Generates a summary of events for a given period
 * @param {array} events - List of events
 * @returns {object} Summary object with statistics
 */
export const generateEventsSummary = (events) => {
  try {
    const summary = {
      totalEvents: events.length,
      confirmedEvents: 0,
      tentativeEvents: 0,
      cancelledEvents: 0,
      allDayEvents: 0,
      eventsWithAttendees: 0,
      eventsWithLocation: 0,
      upcomingEvents: 0,
      pastEvents: 0
    };
    
    const now = new Date();
    
    events.forEach(event => {
      // Status counts
      switch (event.status) {
        case EVENT_STATUS.CONFIRMED:
          summary.confirmedEvents++;
          break;
        case EVENT_STATUS.TENTATIVE:
          summary.tentativeEvents++;
          break;
        case EVENT_STATUS.CANCELLED:
          summary.cancelledEvents++;
          break;
      }
      
      // Feature counts
      if (!event.start?.dateTime) summary.allDayEvents++;
      if (event.attendees?.length > 0) summary.eventsWithAttendees++;
      if (event.location) summary.eventsWithLocation++;
      
      // Time-based counts
      const eventEnd = parseISO(event.end?.dateTime || event.end?.date);
      if (isValid(eventEnd)) {
        if (eventEnd > now) {
          summary.upcomingEvents++;
        } else {
          summary.pastEvents++;
        }
      }
    });
    
    return summary;
  } catch (error) {
    console.error('Error generating events summary:', error);
    return { totalEvents: 0, error: 'Failed to generate summary' };
  }
};