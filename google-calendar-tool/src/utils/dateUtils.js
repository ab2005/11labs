import { format, parseISO, isValid, addDays, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { DATE_FORMATS, DEFAULTS } from './constants.js';

/**
 * Formats a date to ISO string with timezone
 * @param {Date|string} date - Date to format
 * @param {string} timezone - Timezone (defaults to local)
 * @returns {string} ISO formatted date string
 */
export const formatToISO = (date, timezone = DEFAULTS.TIMEZONE) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date provided');
    }
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error formatting date to ISO:', error);
    throw new Error('Invalid date format');
  }
};

/**
 * Formats a date for display
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format string (defaults to display datetime)
 * @returns {string} Formatted date string
 */
export const formatForDisplay = (date, formatString = DATE_FORMATS.DISPLAY_DATETIME) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date provided');
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return 'Invalid date';
  }
};

/**
 * Validates if a date string is in valid ISO format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid ISO date
 */
export const isValidISODate = (dateString) => {
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch (error) {
    return false;
  }
};

/**
 * Creates a date range for calendar queries
 * @param {Date|string} startDate - Start date (defaults to today)
 * @param {Date|string} endDate - End date (defaults to 7 days from start)
 * @returns {object} Object with timeMin and timeMax
 */
export const createDateRange = (startDate, endDate) => {
  try {
    const start = startDate ? parseISO(startDate) : startOfDay(new Date());
    const end = endDate ? parseISO(endDate) : endOfDay(addDays(start, 7));
    
    if (!isValid(start) || !isValid(end)) {
      throw new Error('Invalid date range provided');
    }
    
    if (isAfter(start, end)) {
      throw new Error('Start date must be before end date');
    }
    
    return {
      timeMin: formatToISO(start),
      timeMax: formatToISO(end)
    };
  } catch (error) {
    console.error('Error creating date range:', error);
    throw error;
  }
};

/**
 * Calculates event duration in minutes
 * @param {string} startDateTime - Start date/time ISO string
 * @param {string} endDateTime - End date/time ISO string
 * @returns {number} Duration in minutes
 */
export const calculateDuration = (startDateTime, endDateTime) => {
  try {
    const start = parseISO(startDateTime);
    const end = parseISO(endDateTime);
    
    if (!isValid(start) || !isValid(end)) {
      throw new Error('Invalid date/time provided');
    }
    
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

/**
 * Adds duration to a start time to get end time
 * @param {string} startDateTime - Start date/time ISO string
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} End date/time ISO string
 */
export const addDuration = (startDateTime, durationMinutes = DEFAULTS.EVENT_DURATION_MINUTES) => {
  try {
    const start = parseISO(startDateTime);
    if (!isValid(start)) {
      throw new Error('Invalid start date/time provided');
    }
    
    const end = new Date(start.getTime() + (durationMinutes * 60 * 1000));
    return formatToISO(end);
  } catch (error) {
    console.error('Error adding duration:', error);
    throw error;
  }
};

/**
 * Checks if an event is in the past
 * @param {string} endDateTime - Event end date/time ISO string
 * @returns {boolean} True if event is in the past
 */
export const isEventInPast = (endDateTime) => {
  try {
    const end = parseISO(endDateTime);
    return isValid(end) && isBefore(end, new Date());
  } catch (error) {
    console.error('Error checking if event is in past:', error);
    return false;
  }
};

/**
 * Checks if an event is currently happening
 * @param {string} startDateTime - Event start date/time ISO string
 * @param {string} endDateTime - Event end date/time ISO string
 * @returns {boolean} True if event is currently happening
 */
export const isEventHappening = (startDateTime, endDateTime) => {
  try {
    const start = parseISO(startDateTime);
    const end = parseISO(endDateTime);
    const now = new Date();
    
    if (!isValid(start) || !isValid(end)) {
      return false;
    }
    
    return isAfter(now, start) && isBefore(now, end);
  } catch (error) {
    console.error('Error checking if event is happening:', error);
    return false;
  }
};

/**
 * Converts timezone offset to timezone string
 * @param {number} offsetMinutes - Timezone offset in minutes
 * @returns {string} Timezone string
 */
export const getTimezoneFromOffset = (offsetMinutes) => {
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes < 0 ? '+' : '-';
  
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Parses natural language date/time input
 * @param {string} input - Natural language input (e.g., "tomorrow at 3pm")
 * @returns {string|null} ISO formatted date string or null if parsing fails
 */
export const parseNaturalLanguage = (input) => {
  try {
    const now = new Date();
    const inputLower = input.toLowerCase().trim();
    
    // Handle "today", "tomorrow", "yesterday"
    if (inputLower.includes('today')) {
      return formatToISO(now);
    }
    
    if (inputLower.includes('tomorrow')) {
      return formatToISO(addDays(now, 1));
    }
    
    if (inputLower.includes('yesterday')) {
      return formatToISO(addDays(now, -1));
    }
    
    // Try to parse as ISO first
    if (isValidISODate(input)) {
      return formatToISO(parseISO(input));
    }
    
    // For more complex parsing, you might want to use a library like chrono-node
    return null;
  } catch (error) {
    console.error('Error parsing natural language date:', error);
    return null;
  }
};

/**
 * Creates a Google Calendar date/time object
 * @param {string} dateTimeString - ISO date/time string
 * @param {string} timezone - Timezone (optional)
 * @returns {object} Google Calendar date/time object
 */
export const createGoogleDateTime = (dateTimeString, timezone = DEFAULTS.TIMEZONE) => {
  try {
    const date = parseISO(dateTimeString);
    if (!isValid(date)) {
      throw new Error('Invalid date/time provided');
    }
    
    return {
      dateTime: formatToISO(date),
      timeZone: timezone
    };
  } catch (error) {
    console.error('Error creating Google date/time object:', error);
    throw error;
  }
};

/**
 * Extracts date and time components from ISO string
 * @param {string} isoString - ISO date/time string
 * @returns {object} Object with date and time components
 */
export const extractDateTimeComponents = (isoString) => {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) {
      throw new Error('Invalid ISO date string');
    }
    
    return {
      date: format(date, 'yyyy-MM-dd'),
      time: format(date, 'HH:mm'),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      dayOfWeek: date.getDay(),
      timestamp: date.getTime()
    };
  } catch (error) {
    console.error('Error extracting date/time components:', error);
    throw error;
  }
};