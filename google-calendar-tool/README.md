# Google Calendar Tool for ElevenLabs

A comprehensive Google Calendar integration tool that works with ElevenLabs conversational AI agents.

## Features

- **Calendar Event Management**: Create, read, update, and delete calendar events
- **ElevenLabs Integration**: Handles tool calls from ElevenLabs conversational AI
- **Google OAuth 2.0**: Secure authentication with Google Calendar API
- **Real-time Updates**: Automatic sync with Google Calendar
- **Comprehensive Testing**: Unit and integration tests with high coverage

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

Update the following values:
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `ELEVENLABS_AGENT_ID`: Your ElevenLabs agent ID

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

### 4. Development

```bash
npm run dev
```

### 5. Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## ElevenLabs Tool Integration

This component handles the following ElevenLabs tools:

### 1. `google_calendar_create_event`
Creates a new calendar event.

**Parameters:**
- `summary` (required): Event title
- `start_datetime` (required): Start date/time (ISO format)
- `end_datetime` (required): End date/time (ISO format)
- `description` (optional): Event description
- `location` (optional): Event location
- `attendees` (optional): Comma-separated email addresses

### 2. `google_calendar_list_events`
Lists calendar events for a date range.

**Parameters:**
- `start_date` (optional): Start date (defaults to today)
- `end_date` (optional): End date (defaults to 7 days from start)
- `max_results` (optional): Maximum events to return (default: 10)
- `calendar_id` (optional): Calendar ID (defaults to primary)

### 3. `google_calendar_manage_event`
Updates or deletes an existing event.

**Parameters:**
- `event_id` (required): Google Calendar event ID
- `action` (required): "update" or "delete"
- `summary` (optional): New event title (for updates)
- `start_datetime` (optional): New start time (for updates)
- `end_datetime` (optional): New end time (for updates)
- `description` (optional): New description (for updates)
- `location` (optional): New location (for updates)

## Architecture

```
src/
├── components/          # React components
│   ├── GoogleCalendarTool.js    # Main component
│   ├── CalendarEventForm.js     # Event creation form
│   ├── CalendarEventList.js     # Event list display
│   └── CalendarAuth.js          # OAuth authentication
├── services/            # API services
│   ├── GoogleCalendarAPI.js     # Google Calendar API wrapper
│   ├── ElevenLabsToolHandler.js # Tool call handler
│   └── AuthService.js           # Authentication service
├── utils/              # Utility functions
│   ├── dateUtils.js            # Date/time utilities
│   ├── eventUtils.js           # Event processing
│   └── constants.js            # Constants
└── hooks/              # Custom React hooks
    ├── useGoogleCalendar.js    # Calendar operations
    └── useElevenLabsTools.js   # Tool handling
```

## API Reference

### GoogleCalendarAPI

```javascript
import GoogleCalendarAPI from './services/GoogleCalendarAPI';

const api = new GoogleCalendarAPI(accessToken);

// Create event
const event = await api.createEvent({
  summary: 'Meeting',
  start: { dateTime: '2025-07-11T10:00:00-07:00' },
  end: { dateTime: '2025-07-11T11:00:00-07:00' }
});

// List events
const events = await api.listEvents({
  timeMin: '2025-07-11T00:00:00-07:00',
  timeMax: '2025-07-18T23:59:59-07:00'
});

// Update event
const updatedEvent = await api.updateEvent(eventId, {
  summary: 'Updated Meeting'
});

// Delete event
await api.deleteEvent(eventId);
```

### ElevenLabsToolHandler

```javascript
import ElevenLabsToolHandler from './services/ElevenLabsToolHandler';

const handler = new ElevenLabsToolHandler(calendarAPI);

// Handle tool call
const response = await handler.handleToolCall({
  tool_name: 'google_calendar_create_event',
  parameters: {
    summary: 'New Meeting',
    start_datetime: '2025-07-11T10:00:00-07:00',
    end_datetime: '2025-07-11T11:00:00-07:00'
  }
});
```

## Testing

The project includes comprehensive tests:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test API integrations and workflows
- **Coverage**: Aim for 85%+ code coverage
- **Mocking**: Mock external APIs for reliable testing

Run tests with:

```bash
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.