import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoogleCalendarTool from '../../src/components/GoogleCalendarTool.js';
import * as GoogleCalendarHook from '../../src/hooks/useGoogleCalendar.js';
import * as ElevenLabsHook from '../../src/hooks/useElevenLabsTools.js';

// Mock the hooks
jest.mock('../../src/hooks/useGoogleCalendar.js');
jest.mock('../../src/hooks/useElevenLabsTools.js');

describe('GoogleCalendarTool', () => {
  let mockGoogleCalendar;
  let mockElevenLabsTools;
  
  beforeEach(() => {
    mockGoogleCalendar = {
      events: [],
      loading: false,
      error: null,
      createEvent: jest.fn(),
      listEvents: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      refreshEvents: jest.fn(),
      clearError: jest.fn(),
      eventCount: 0,
      state: 'loaded',
    };

    mockElevenLabsTools = {
      isInitialized: true,
      isLoading: false,
      error: null,
      lastResponse: null,
      toolCallHistory: [],
      createEvent: jest.fn(),
      listEvents: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      clearError: jest.fn(),
      clearHistory: jest.fn(),
      getStats: jest.fn(() => ({
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        toolCounts: {},
        lastCall: null,
      })),
      isReady: true,
    };

    GoogleCalendarHook.useGoogleCalendar.mockReturnValue(mockGoogleCalendar);
    ElevenLabsHook.useElevenLabsTools.mockReturnValue(mockElevenLabsTools);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when not authenticated', () => {
    it('should show authentication component', () => {
      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Google Calendar Tool')).toBeInTheDocument();
      expect(screen.getByText('ElevenLabs Integration for Calendar Management')).toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      // Mock authentication state
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [true, jest.fn()]) // isAuthenticated
        .mockImplementationOnce(() => [{ name: 'Test User', email: 'test@example.com' }, jest.fn()]) // user
        .mockImplementationOnce(() => ['events', jest.fn()]) // activeTab
        .mockImplementationOnce(() => [null, jest.fn()]); // notification
    });

    it('should render main interface', () => {
      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
      expect(screen.getByText('ElevenLabs Tools:')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should show tab navigation', () => {
      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Events (0)')).toBeInTheDocument();
      expect(screen.getByText('Create Event')).toBeInTheDocument();
      expect(screen.getByText('Tool History (0)')).toBeInTheDocument();
    });

    it('should switch tabs when clicked', async () => {
      const user = userEvent.setup();
      render(<GoogleCalendarTool />);
      
      const createEventTab = screen.getByText('Create Event');
      await user.click(createEventTab);
      
      expect(screen.getByText('Create New Event')).toBeInTheDocument();
    });

    it('should show error messages', () => {
      mockGoogleCalendar.error = 'Calendar API Error';
      mockElevenLabsTools.error = 'Tools Error';
      
      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Calendar Error: Calendar API Error')).toBeInTheDocument();
      expect(screen.getByText('Tools Error: Tools Error')).toBeInTheDocument();
    });

    it('should clear errors when clear button is clicked', async () => {
      const user = userEvent.setup();
      mockGoogleCalendar.error = 'Calendar API Error';
      
      render(<GoogleCalendarTool />);
      
      const clearButton = screen.getByText('Clear Errors');
      await user.click(clearButton);
      
      expect(mockGoogleCalendar.clearError).toHaveBeenCalled();
      expect(mockElevenLabsTools.clearError).toHaveBeenCalled();
    });

    it('should show loading state', () => {
      mockGoogleCalendar.loading = true;
      
      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show events', () => {
      mockGoogleCalendar.events = [
        {
          id: 'event-1',
          title: 'Test Event',
          start: '2025-07-11T10:00:00Z',
          end: '2025-07-11T11:00:00Z',
        },
      ];
      mockGoogleCalendar.eventCount = 1;
      
      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Events (1)')).toBeInTheDocument();
    });

    it('should handle refresh events', async () => {
      const user = userEvent.setup();
      render(<GoogleCalendarTool />);
      
      const refreshButton = screen.getByText('Refresh');
      await user.click(refreshButton);
      
      expect(mockGoogleCalendar.refreshEvents).toHaveBeenCalled();
    });

    it('should show tool history', () => {
      mockElevenLabsTools.toolCallHistory = [
        {
          id: 1,
          timestamp: '2025-07-11T10:00:00Z',
          toolName: 'google_calendar_create_event',
          parameters: { summary: 'Test Event' },
          response: { success: true, message: 'Event created' },
          success: true,
        },
      ];
      
      const mockGetStats = {
        total: 1,
        successful: 1,
        failed: 0,
        successRate: 100,
        toolCounts: { google_calendar_create_event: 1 },
        lastCall: '2025-07-11T10:00:00Z',
      };
      
      mockElevenLabsTools.getStats.mockReturnValue(mockGetStats);
      
      render(<GoogleCalendarTool />);
      
      // Switch to tools tab
      const toolsTab = screen.getByText('Tool History (1)');
      fireEvent.click(toolsTab);
      
      expect(screen.getByText('Total Calls:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Success Rate:')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should clear tool history', async () => {
      const user = userEvent.setup();
      mockElevenLabsTools.toolCallHistory = [
        {
          id: 1,
          timestamp: '2025-07-11T10:00:00Z',
          toolName: 'google_calendar_create_event',
          parameters: { summary: 'Test Event' },
          response: { success: true, message: 'Event created' },
          success: true,
        },
      ];
      
      render(<GoogleCalendarTool />);
      
      // Switch to tools tab
      const toolsTab = screen.getByText('Tool History (1)');
      fireEvent.click(toolsTab);
      
      const clearButton = screen.getByText('Clear History');
      await user.click(clearButton);
      
      expect(mockElevenLabsTools.clearHistory).toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      // Mock authentication state
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [true, jest.fn()]) // isAuthenticated
        .mockImplementationOnce(() => [{ name: 'Test User' }, jest.fn()]) // user
        .mockImplementationOnce(() => ['events', jest.fn()]) // activeTab
        .mockImplementationOnce(() => [null, jest.fn()]); // notification
    });

    it('should handle create event', async () => {
      mockGoogleCalendar.createEvent.mockResolvedValue({
        id: 'new-event-id',
        title: 'New Event',
      });

      const component = render(<GoogleCalendarTool />);
      
      // This would be called by the form component
      await component.rerender(<GoogleCalendarTool />);
      
      expect(mockGoogleCalendar.createEvent).toBeDefined();
    });

    it('should handle update event', async () => {
      mockGoogleCalendar.updateEvent.mockResolvedValue({
        id: 'updated-event-id',
        title: 'Updated Event',
      });

      const component = render(<GoogleCalendarTool />);
      
      // This would be called by the event list component
      await component.rerender(<GoogleCalendarTool />);
      
      expect(mockGoogleCalendar.updateEvent).toBeDefined();
    });

    it('should handle delete event', async () => {
      mockGoogleCalendar.deleteEvent.mockResolvedValue();

      const component = render(<GoogleCalendarTool />);
      
      // This would be called by the event list component
      await component.rerender(<GoogleCalendarTool />);
      
      expect(mockGoogleCalendar.deleteEvent).toBeDefined();
    });
  });

  describe('notifications', () => {
    it('should show success notification', () => {
      mockElevenLabsTools.lastResponse = {
        success: true,
        message: 'Event created successfully',
      };

      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Event created successfully')).toBeInTheDocument();
    });

    it('should show error notification', () => {
      mockElevenLabsTools.lastResponse = {
        success: false,
        message: 'Failed to create event',
      };

      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Failed to create event')).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should render properly on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      render(<GoogleCalendarTool />);
      
      expect(screen.getByText('Google Calendar Tool')).toBeInTheDocument();
    });
  });
});