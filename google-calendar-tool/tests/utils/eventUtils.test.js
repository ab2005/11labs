import {
  validateEventData,
  convertToGoogleCalendarEvent,
  parseAttendees,
  isValidEmail,
  formatEventForDisplay,
  createQuickEvent,
  validateToolCall,
  createToolResponse,
  findEventConflicts,
  generateEventsSummary
} from '../../src/utils/eventUtils.js';
import { ELEVENLABS_TOOLS, EVENT_ACTIONS } from '../../src/utils/constants.js';

describe('eventUtils', () => {
  describe('validateEventData', () => {
    it('should validate valid event data', () => {
      const eventData = {
        summary: 'Test Event',
        start_datetime: '2025-07-11T10:00:00Z',
        end_datetime: '2025-07-11T11:00:00Z'
      };
      
      const result = validateEventData(eventData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate event data with missing summary', () => {
      const eventData = {
        start_datetime: '2025-07-11T10:00:00Z',
        end_datetime: '2025-07-11T11:00:00Z'
      };
      
      const result = validateEventData(eventData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: summary');
    });

    it('should invalidate event data with invalid start time', () => {
      const eventData = {
        summary: 'Test Event',
        start_datetime: 'invalid-date',
        end_datetime: '2025-07-11T11:00:00Z'
      };
      
      const result = validateEventData(eventData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: start_datetime (valid ISO format)');
    });

    it('should invalidate event data with end time before start time', () => {
      const eventData = {
        summary: 'Test Event',
        start_datetime: '2025-07-11T11:00:00Z',
        end_datetime: '2025-07-11T10:00:00Z'
      };
      
      const result = validateEventData(eventData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End time must be after start time');
    });

    it('should invalidate event data with invalid attendees format', () => {
      const eventData = {
        summary: 'Test Event',
        start_datetime: '2025-07-11T10:00:00Z',
        end_datetime: '2025-07-11T11:00:00Z',
        attendees: 123 // Should be string
      };
      
      const result = validateEventData(eventData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Attendees must be a comma-separated string of email addresses');
    });
  });

  describe('convertToGoogleCalendarEvent', () => {
    it('should convert valid event data to Google Calendar format', () => {
      const eventData = {
        summary: 'Test Event',
        start_datetime: '2025-07-11T10:00:00Z',
        end_datetime: '2025-07-11T11:00:00Z',
        description: 'Test Description',
        location: 'Test Location',
        attendees: 'test@example.com, test2@example.com'
      };
      
      const result = convertToGoogleCalendarEvent(eventData);
      
      expect(result.summary).toBe('Test Event');
      expect(result.description).toBe('Test Description');
      expect(result.location).toBe('Test Location');
      expect(result.start).toHaveProperty('dateTime');
      expect(result.end).toHaveProperty('dateTime');
      expect(result.attendees).toHaveLength(2);
      expect(result.attendees[0].email).toBe('test@example.com');
      expect(result.attendees[1].email).toBe('test2@example.com');
    });

    it('should throw error for invalid event data', () => {
      const eventData = {
        // Missing required fields
      };
      
      expect(() => convertToGoogleCalendarEvent(eventData)).toThrow();
    });
  });

  describe('parseAttendees', () => {
    it('should parse comma-separated email addresses', () => {
      const attendeesString = 'test@example.com, test2@example.com, test3@example.com';
      const result = parseAttendees(attendeesString);
      
      expect(result).toHaveLength(3);
      expect(result[0].email).toBe('test@example.com');
      expect(result[1].email).toBe('test2@example.com');
      expect(result[2].email).toBe('test3@example.com');
    });

    it('should filter out invalid email addresses', () => {
      const attendeesString = 'test@example.com, invalid-email, test2@example.com';
      const result = parseAttendees(attendeesString);
      
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('test@example.com');
      expect(result[1].email).toBe('test2@example.com');
    });

    it('should handle empty or invalid input', () => {
      expect(parseAttendees('')).toEqual([]);
      expect(parseAttendees(null)).toEqual([]);
      expect(parseAttendees(undefined)).toEqual([]);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should invalidate incorrect email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
    });
  });

  describe('formatEventForDisplay', () => {
    it('should format Google Calendar event for display', () => {
      const event = {
        id: 'test-id',
        summary: 'Test Event',
        start: { dateTime: '2025-07-11T10:00:00Z' },
        end: { dateTime: '2025-07-11T11:00:00Z' },
        description: 'Test Description',
        location: 'Test Location',
        attendees: [{ email: 'test@example.com' }],
        status: 'confirmed',
        created: '2025-07-11T09:00:00Z',
        updated: '2025-07-11T09:30:00Z',
        htmlLink: 'https://calendar.google.com/event?eid=test',
        creator: { email: 'creator@example.com' }
      };
      
      const result = formatEventForDisplay(event);
      
      expect(result.id).toBe('test-id');
      expect(result.title).toBe('Test Event');
      expect(result.start).toBe('2025-07-11T10:00:00Z');
      expect(result.end).toBe('2025-07-11T11:00:00Z');
      expect(result.description).toBe('Test Description');
      expect(result.location).toBe('Test Location');
      expect(result.attendees).toEqual(['test@example.com']);
      expect(result.status).toBe('confirmed');
      expect(result.isAllDay).toBe(false);
      expect(result.creator).toBe('creator@example.com');
    });

    it('should handle all-day events', () => {
      const event = {
        id: 'test-id',
        summary: 'All Day Event',
        start: { date: '2025-07-11' },
        end: { date: '2025-07-12' }
      };
      
      const result = formatEventForDisplay(event);
      
      expect(result.isAllDay).toBe(true);
      expect(result.start).toBe('2025-07-11');
      expect(result.end).toBe('2025-07-12');
    });

    it('should handle events with missing data gracefully', () => {
      const event = {
        id: 'test-id'
      };
      
      const result = formatEventForDisplay(event);
      
      expect(result.title).toBe('Untitled Event');
      expect(result.description).toBe('');
      expect(result.location).toBe('');
      expect(result.attendees).toEqual([]);
    });
  });

  describe('createQuickEvent', () => {
    it('should create event from natural language input', () => {
      const input = 'Meeting tomorrow at 3pm';
      const result = createQuickEvent(input);
      
      expect(result).not.toBeNull();
      expect(result.summary).toBe('Meeting');
      expect(result.start_datetime).toBeDefined();
      expect(result.end_datetime).toBeDefined();
    });

    it('should handle input with time but no date', () => {
      const input = 'Lunch at 12pm';
      const result = createQuickEvent(input);
      
      expect(result).not.toBeNull();
      expect(result.summary).toBe('Lunch');
    });

    it('should return null for unparseable input', () => {
      const input = 'This is not a valid event';
      const result = createQuickEvent(input);
      
      expect(result).toBeNull();
    });
  });

  describe('validateToolCall', () => {
    it('should validate create event tool call', () => {
      const toolName = ELEVENLABS_TOOLS.CREATE_EVENT;
      const parameters = {
        summary: 'Test Event',
        start_datetime: '2025-07-11T10:00:00Z',
        end_datetime: '2025-07-11T11:00:00Z'
      };
      
      const result = validateToolCall(toolName, parameters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate list events tool call', () => {
      const toolName = ELEVENLABS_TOOLS.LIST_EVENTS;
      const parameters = {
        start_date: '2025-07-11T00:00:00Z',
        end_date: '2025-07-18T23:59:59Z',
        max_results: 10
      };
      
      const result = validateToolCall(toolName, parameters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate manage event tool call', () => {
      const toolName = ELEVENLABS_TOOLS.MANAGE_EVENT;
      const parameters = {
        event_id: 'test-event-id',
        action: EVENT_ACTIONS.UPDATE,
        summary: 'Updated Event Title'
      };
      
      const result = validateToolCall(toolName, parameters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate unknown tool', () => {
      const toolName = 'unknown_tool';
      const parameters = {};
      
      const result = validateToolCall(toolName, parameters);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid tool name: unknown_tool');
    });

    it('should invalidate manage event without required fields', () => {
      const toolName = ELEVENLABS_TOOLS.MANAGE_EVENT;
      const parameters = {};
      
      const result = validateToolCall(toolName, parameters);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: event_id');
      expect(result.errors).toContain('Missing required field: action (update or delete)');
    });
  });

  describe('createToolResponse', () => {
    it('should create successful tool response', () => {
      const response = createToolResponse(true, { eventId: 'test-id' }, 'Event created successfully');
      
      expect(response.success).toBe(true);
      expect(response.data.eventId).toBe('test-id');
      expect(response.message).toBe('Event created successfully');
      expect(response.timestamp).toBeDefined();
    });

    it('should create error tool response', () => {
      const response = createToolResponse(false, null, 'Error occurred');
      
      expect(response.success).toBe(false);
      expect(response.data).toBeNull();
      expect(response.message).toBe('Error occurred');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('findEventConflicts', () => {
    it('should find conflicting events', () => {
      const events = [
        {
          start: { dateTime: '2025-07-11T10:00:00Z' },
          end: { dateTime: '2025-07-11T11:00:00Z' }
        },
        {
          start: { dateTime: '2025-07-11T14:00:00Z' },
          end: { dateTime: '2025-07-11T15:00:00Z' }
        }
      ];
      
      const newEvent = {
        start_datetime: '2025-07-11T10:30:00Z',
        end_datetime: '2025-07-11T11:30:00Z'
      };
      
      const conflicts = findEventConflicts(events, newEvent);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toBe(events[0]);
    });

    it('should not find conflicts for non-overlapping events', () => {
      const events = [
        {
          start: { dateTime: '2025-07-11T10:00:00Z' },
          end: { dateTime: '2025-07-11T11:00:00Z' }
        }
      ];
      
      const newEvent = {
        start_datetime: '2025-07-11T12:00:00Z',
        end_datetime: '2025-07-11T13:00:00Z'
      };
      
      const conflicts = findEventConflicts(events, newEvent);
      expect(conflicts).toHaveLength(0);
    });

    it('should handle invalid dates gracefully', () => {
      const events = [
        {
          start: { dateTime: 'invalid-date' },
          end: { dateTime: 'invalid-date' }
        }
      ];
      
      const newEvent = {
        start_datetime: '2025-07-11T10:00:00Z',
        end_datetime: '2025-07-11T11:00:00Z'
      };
      
      const conflicts = findEventConflicts(events, newEvent);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('generateEventsSummary', () => {
    it('should generate summary for events', () => {
      const events = [
        {
          status: 'confirmed',
          start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
          end: { dateTime: new Date(Date.now() + 7200000).toISOString() },
          attendees: [{ email: 'test@example.com' }],
          location: 'Test Location'
        },
        {
          status: 'tentative',
          start: { dateTime: new Date(Date.now() - 3600000).toISOString() },
          end: { dateTime: new Date(Date.now() - 1800000).toISOString() }
        }
      ];
      
      const summary = generateEventsSummary(events);
      
      expect(summary.totalEvents).toBe(2);
      expect(summary.confirmedEvents).toBe(1);
      expect(summary.tentativeEvents).toBe(1);
      expect(summary.upcomingEvents).toBe(1);
      expect(summary.pastEvents).toBe(1);
      expect(summary.eventsWithAttendees).toBe(1);
      expect(summary.eventsWithLocation).toBe(1);
    });

    it('should handle empty events array', () => {
      const summary = generateEventsSummary([]);
      
      expect(summary.totalEvents).toBe(0);
      expect(summary.confirmedEvents).toBe(0);
      expect(summary.tentativeEvents).toBe(0);
    });

    it('should handle errors gracefully', () => {
      const summary = generateEventsSummary(null);
      
      expect(summary.totalEvents).toBe(0);
      expect(summary.error).toBeDefined();
    });
  });
});