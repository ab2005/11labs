import { GoogleCalendarAPI } from '../../src/services/GoogleCalendarAPI.js';
import { google } from 'googleapis';

jest.mock('googleapis');

describe('GoogleCalendarAPI', () => {
  let mockCalendar;
  let mockAuth;
  let api;

  beforeEach(() => {
    mockAuth = {
      setCredentials: jest.fn(),
    };

    mockCalendar = {
      events: {
        insert: jest.fn(),
        list: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      calendarList: {
        list: jest.fn(),
      },
      calendars: {
        get: jest.fn(),
      },
      freebusy: {
        query: jest.fn(),
      },
    };

    google.auth.OAuth2.mockImplementation(() => mockAuth);
    google.calendar.mockImplementation(() => mockCalendar);

    api = new GoogleCalendarAPI('test-access-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with access token', () => {
      expect(google.auth.OAuth2).toHaveBeenCalled();
      expect(mockAuth.setCredentials).toHaveBeenCalledWith({ access_token: 'test-access-token' });
      expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth: mockAuth });
    });
  });

  describe('createEvent', () => {
    const validEventData = {
      summary: 'Test Event',
      start_datetime: '2025-07-11T10:00:00Z',
      end_datetime: '2025-07-11T11:00:00Z',
    };

    it('should create event successfully', async () => {
      const mockEvent = {
        id: 'test-event-id',
        summary: 'Test Event',
        start: { dateTime: '2025-07-11T10:00:00Z' },
        end: { dateTime: '2025-07-11T11:00:00Z' },
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockEvent });

      const result = await api.createEvent(validEventData);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        resource: expect.objectContaining({
          summary: 'Test Event',
        }),
        sendNotifications: true,
      });
      expect(result).toEqual(mockEvent);
    });

    it('should throw error for invalid event data', async () => {
      const invalidEventData = {
        summary: 'Test Event',
        // Missing required fields
      };

      await expect(api.createEvent(invalidEventData)).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      mockCalendar.events.insert.mockRejectedValue(new Error('API Error'));

      await expect(api.createEvent(validEventData)).rejects.toThrow();
    });
  });

  describe('listEvents', () => {
    it('should list events successfully', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          summary: 'Event 1',
          start: { dateTime: '2025-07-11T10:00:00Z' },
          end: { dateTime: '2025-07-11T11:00:00Z' },
        },
        {
          id: 'event-2',
          summary: 'Event 2',
          start: { dateTime: '2025-07-11T14:00:00Z' },
          end: { dateTime: '2025-07-11T15:00:00Z' },
        },
      ];

      mockCalendar.events.list.mockResolvedValue({ data: { items: mockEvents } });

      const result = await api.listEvents();

      expect(mockCalendar.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: expect.any(String),
        timeMax: expect.any(String),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
        q: null,
      });
      expect(result).toEqual(mockEvents);
    });

    it('should handle empty response', async () => {
      mockCalendar.events.list.mockResolvedValue({ data: {} });

      const result = await api.listEvents();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockCalendar.events.list.mockRejectedValue(new Error('API Error'));

      await expect(api.listEvents()).rejects.toThrow();
    });
  });

  describe('getEvent', () => {
    it('should get event successfully', async () => {
      const mockEvent = {
        id: 'test-event-id',
        summary: 'Test Event',
      };

      mockCalendar.events.get.mockResolvedValue({ data: mockEvent });

      const result = await api.getEvent('test-event-id');

      expect(mockCalendar.events.get).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'test-event-id',
      });
      expect(result).toEqual(mockEvent);
    });

    it('should throw error for missing event ID', async () => {
      await expect(api.getEvent()).rejects.toThrow('Invalid event ID provided');
    });

    it('should handle API errors', async () => {
      mockCalendar.events.get.mockRejectedValue(new Error('API Error'));

      await expect(api.getEvent('test-event-id')).rejects.toThrow();
    });
  });

  describe('updateEvent', () => {
    const updateData = {
      summary: 'Updated Event',
      start_datetime: '2025-07-11T10:00:00Z',
      end_datetime: '2025-07-11T11:00:00Z',
    };

    it('should update event successfully', async () => {
      const existingEvent = {
        id: 'test-event-id',
        summary: 'Original Event',
      };

      const updatedEvent = {
        id: 'test-event-id',
        summary: 'Updated Event',
      };

      mockCalendar.events.get.mockResolvedValue({ data: existingEvent });
      mockCalendar.events.update.mockResolvedValue({ data: updatedEvent });

      const result = await api.updateEvent('test-event-id', updateData);

      expect(mockCalendar.events.get).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'test-event-id',
      });
      expect(mockCalendar.events.update).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'test-event-id',
        resource: expect.objectContaining({
          summary: 'Updated Event',
        }),
        sendNotifications: true,
      });
      expect(result).toEqual(updatedEvent);
    });

    it('should throw error for missing event ID', async () => {
      await expect(api.updateEvent(null, updateData)).rejects.toThrow('Invalid event ID provided');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      mockCalendar.events.delete.mockResolvedValue();

      await api.deleteEvent('test-event-id');

      expect(mockCalendar.events.delete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'test-event-id',
        sendNotifications: true,
      });
    });

    it('should throw error for missing event ID', async () => {
      await expect(api.deleteEvent()).rejects.toThrow('Invalid event ID provided');
    });

    it('should handle API errors', async () => {
      mockCalendar.events.delete.mockRejectedValue(new Error('API Error'));

      await expect(api.deleteEvent('test-event-id')).rejects.toThrow();
    });
  });

  describe('listCalendars', () => {
    it('should list calendars successfully', async () => {
      const mockCalendars = [
        { id: 'primary', summary: 'Primary Calendar' },
        { id: 'secondary', summary: 'Secondary Calendar' },
      ];

      mockCalendar.calendarList.list.mockResolvedValue({ data: { items: mockCalendars } });

      const result = await api.listCalendars();

      expect(mockCalendar.calendarList.list).toHaveBeenCalled();
      expect(result).toEqual(mockCalendars);
    });

    it('should handle empty response', async () => {
      mockCalendar.calendarList.list.mockResolvedValue({ data: {} });

      const result = await api.listCalendars();

      expect(result).toEqual([]);
    });
  });

  describe('searchEvents', () => {
    it('should search events successfully', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          summary: 'Meeting with John',
        },
      ];

      mockCalendar.events.list.mockResolvedValue({ data: { items: mockEvents } });

      const result = await api.searchEvents('John');

      expect(mockCalendar.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        q: 'John',
        timeMin: expect.any(String),
        timeMax: expect.any(String),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getFreeBusy', () => {
    it('should get free/busy information successfully', async () => {
      const mockFreeBusy = {
        calendars: {
          primary: {
            busy: [],
          },
        },
      };

      mockCalendar.freebusy.query.mockResolvedValue({ data: mockFreeBusy });

      const result = await api.getFreeBusy();

      expect(mockCalendar.freebusy.query).toHaveBeenCalledWith({
        resource: {
          timeMin: expect.any(String),
          timeMax: expect.any(String),
          items: [{ id: 'primary' }],
        },
      });
      expect(result).toEqual(mockFreeBusy);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', async () => {
      mockCalendar.calendarList.list.mockResolvedValue({ data: { items: [] } });

      const result = await api.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when not authenticated', async () => {
      mockCalendar.calendarList.list.mockRejectedValue(new Error('Unauthorized'));

      const result = await api.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('handleAPIError', () => {
    it('should handle 401 errors', () => {
      const error = {
        response: {
          status: 401,
          data: { error: { message: 'Unauthorized' } },
        },
      };

      const result = api.handleAPIError(error);

      expect(result.message).toBe('Authentication required. Please sign in with Google.');
    });

    it('should handle 403 errors', () => {
      const error = {
        response: {
          status: 403,
          data: { error: { message: 'Forbidden' } },
        },
      };

      const result = api.handleAPIError(error);

      expect(result.message).toBe('Permission denied. Please check calendar permissions.');
    });

    it('should handle 404 errors', () => {
      const error = {
        response: {
          status: 404,
          data: { error: { message: 'Not Found' } },
        },
      };

      const result = api.handleAPIError(error);

      expect(result.message).toBe('Event not found.');
    });

    it('should handle network errors', () => {
      const error = {
        code: 'ENOTFOUND',
        message: 'Network error',
      };

      const result = api.handleAPIError(error);

      expect(result.message).toBe('Network error. Please check your connection.');
    });

    it('should handle generic errors', () => {
      const error = {
        message: 'Generic error',
      };

      const result = api.handleAPIError(error);

      expect(result.message).toBe('Generic error');
    });
  });
});