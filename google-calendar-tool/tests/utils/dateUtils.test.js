import {
  formatToISO,
  formatForDisplay,
  isValidISODate,
  createDateRange,
  calculateDuration,
  addDuration,
  isEventInPast,
  isEventHappening,
  parseNaturalLanguage,
  createGoogleDateTime,
  extractDateTimeComponents
} from '../../src/utils/dateUtils.js';

describe('dateUtils', () => {
  describe('formatToISO', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2025-07-11T10:00:00Z');
      const result = formatToISO(date);
      expect(result).toBe('2025-07-11T10:00:00.000Z');
    });

    it('should format string date to ISO string', () => {
      const dateString = '2025-07-11T10:00:00Z';
      const result = formatToISO(dateString);
      expect(result).toBe('2025-07-11T10:00:00.000Z');
    });

    it('should throw error for invalid date', () => {
      expect(() => formatToISO('invalid-date')).toThrow('Invalid date format');
    });
  });

  describe('formatForDisplay', () => {
    it('should format date for display', () => {
      const date = new Date('2025-07-11T10:00:00Z');
      const result = formatForDisplay(date);
      expect(result).toMatch(/Jul 11, 2025/);
    });

    it('should handle invalid date gracefully', () => {
      const result = formatForDisplay('invalid-date');
      expect(result).toBe('Invalid date');
    });
  });

  describe('isValidISODate', () => {
    it('should return true for valid ISO date', () => {
      expect(isValidISODate('2025-07-11T10:00:00Z')).toBe(true);
      expect(isValidISODate('2025-07-11T10:00:00.000Z')).toBe(true);
    });

    it('should return false for invalid ISO date', () => {
      expect(isValidISODate('invalid-date')).toBe(false);
      expect(isValidISODate('2025-13-32T25:00:00Z')).toBe(false);
    });
  });

  describe('createDateRange', () => {
    it('should create date range with provided dates', () => {
      const start = '2025-07-11T00:00:00Z';
      const end = '2025-07-18T23:59:59Z';
      const range = createDateRange(start, end);
      
      expect(range.timeMin).toBe('2025-07-11T00:00:00.000Z');
      expect(range.timeMax).toBe('2025-07-18T23:59:59.000Z');
    });

    it('should create default range when no dates provided', () => {
      const range = createDateRange();
      expect(range.timeMin).toBeDefined();
      expect(range.timeMax).toBeDefined();
    });

    it('should throw error when start date is after end date', () => {
      const start = '2025-07-18T00:00:00Z';
      const end = '2025-07-11T00:00:00Z';
      expect(() => createDateRange(start, end)).toThrow('Start date must be before end date');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration in minutes', () => {
      const start = '2025-07-11T10:00:00Z';
      const end = '2025-07-11T11:30:00Z';
      const duration = calculateDuration(start, end);
      expect(duration).toBe(90); // 1.5 hours = 90 minutes
    });

    it('should return 0 for invalid dates', () => {
      const duration = calculateDuration('invalid', 'invalid');
      expect(duration).toBe(0);
    });
  });

  describe('addDuration', () => {
    it('should add duration to start time', () => {
      const start = '2025-07-11T10:00:00Z';
      const result = addDuration(start, 60);
      expect(result).toBe('2025-07-11T11:00:00.000Z');
    });

    it('should use default duration when not provided', () => {
      const start = '2025-07-11T10:00:00Z';
      const result = addDuration(start);
      expect(result).toBe('2025-07-11T11:00:00.000Z'); // Default 60 minutes
    });

    it('should throw error for invalid start date', () => {
      expect(() => addDuration('invalid-date', 60)).toThrow();
    });
  });

  describe('isEventInPast', () => {
    it('should return true for past events', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      expect(isEventInPast(pastDate)).toBe(true);
    });

    it('should return false for future events', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      expect(isEventInPast(futureDate)).toBe(false);
    });

    it('should handle invalid date gracefully', () => {
      expect(isEventInPast('invalid-date')).toBe(false);
    });
  });

  describe('isEventHappening', () => {
    it('should return true for events happening now', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 1800000).toISOString(); // 30 minutes ago
      const end = new Date(now.getTime() + 1800000).toISOString(); // 30 minutes from now
      
      expect(isEventHappening(start, end)).toBe(true);
    });

    it('should return false for events not happening now', () => {
      const now = new Date();
      const start = new Date(now.getTime() + 1800000).toISOString(); // 30 minutes from now
      const end = new Date(now.getTime() + 3600000).toISOString(); // 1 hour from now
      
      expect(isEventHappening(start, end)).toBe(false);
    });

    it('should handle invalid dates gracefully', () => {
      expect(isEventHappening('invalid', 'invalid')).toBe(false);
    });
  });

  describe('parseNaturalLanguage', () => {
    it('should parse "today"', () => {
      const result = parseNaturalLanguage('today');
      expect(result).toBeDefined();
      expect(new Date(result).toDateString()).toBe(new Date().toDateString());
    });

    it('should parse "tomorrow"', () => {
      const result = parseNaturalLanguage('tomorrow');
      expect(result).toBeDefined();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(new Date(result).toDateString()).toBe(tomorrow.toDateString());
    });

    it('should parse ISO date strings', () => {
      const isoDate = '2025-07-11T10:00:00Z';
      const result = parseNaturalLanguage(isoDate);
      expect(result).toBe('2025-07-11T10:00:00.000Z');
    });

    it('should return null for unparseable input', () => {
      const result = parseNaturalLanguage('unknown phrase');
      expect(result).toBeNull();
    });
  });

  describe('createGoogleDateTime', () => {
    it('should create Google Calendar date/time object', () => {
      const dateTime = '2025-07-11T10:00:00Z';
      const result = createGoogleDateTime(dateTime);
      
      expect(result).toHaveProperty('dateTime');
      expect(result).toHaveProperty('timeZone');
      expect(result.dateTime).toBe('2025-07-11T10:00:00.000Z');
    });

    it('should use provided timezone', () => {
      const dateTime = '2025-07-11T10:00:00Z';
      const timezone = 'America/New_York';
      const result = createGoogleDateTime(dateTime, timezone);
      
      expect(result.timeZone).toBe(timezone);
    });

    it('should throw error for invalid date', () => {
      expect(() => createGoogleDateTime('invalid-date')).toThrow();
    });
  });

  describe('extractDateTimeComponents', () => {
    it('should extract date and time components', () => {
      const isoString = '2025-07-11T10:30:00Z';
      const components = extractDateTimeComponents(isoString);
      
      expect(components).toHaveProperty('date');
      expect(components).toHaveProperty('time');
      expect(components).toHaveProperty('year');
      expect(components).toHaveProperty('month');
      expect(components).toHaveProperty('day');
      expect(components).toHaveProperty('hour');
      expect(components).toHaveProperty('minute');
      expect(components).toHaveProperty('dayOfWeek');
      expect(components).toHaveProperty('timestamp');
      
      expect(components.date).toBe('2025-07-11');
      expect(components.time).toBe('10:30');
      expect(components.year).toBe(2025);
      expect(components.month).toBe(7);
      expect(components.day).toBe(11);
      expect(components.hour).toBe(10);
      expect(components.minute).toBe(30);
    });

    it('should throw error for invalid ISO string', () => {
      expect(() => extractDateTimeComponents('invalid-date')).toThrow();
    });
  });
});