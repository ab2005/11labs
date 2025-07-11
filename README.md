# ElevenLabs Google Calendar Integration

A React-based tool that enables ElevenLabs conversational AI agents to manage Google Calendar events through voice interactions.

## Features

- **Calendar Management**: Create, read, update, and delete calendar events
- **ElevenLabs Integration**: Three specialized tools for conversational AI
- **OAuth Authentication**: Secure Google Calendar API access
- **Real-time Updates**: Dynamic calendar event management
- **Comprehensive Testing**: 85% code coverage with Jest and React Testing Library

## Architecture

### Core Components

- **GoogleCalendarTool** - Main container component
- **CalendarAuth** - OAuth 2.0 authentication flow
- **CalendarEventForm** - Event creation and editing
- **CalendarEventList** - Event display and management
- **ElevenLabsToolHandler** - AI tool integration

### ElevenLabs Tools

1. **google_calendar_create_event** - Create new calendar events
2. **google_calendar_list_events** - Query events by date range
3. **google_calendar_manage_event** - Update or delete existing events

## Quick Start

### Prerequisites

- Node.js 18+ 
- Google Cloud Project with Calendar API enabled
- ElevenLabs account and API key

### Installation

```bash
git clone https://github.com/ab2005/11labs.git
cd 11labs/google-calendar-tool
npm install
```

### Configuration

Create a `.env` file in the `google-calendar-tool` directory:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
```

### Development

```bash
npm run dev    # Start development server on http://localhost:3000
npm run test   # Run tests
npm run build  # Build for production
```

## Google Cloud Setup

1. Create a new project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials
4. Add your domain to authorized JavaScript origins
5. Add your redirect URI to authorized redirect URIs

## ElevenLabs Integration

The tool integrates with ElevenLabs through three specialized tools that handle:

- **Event Creation**: Natural language event creation with date/time parsing
- **Event Querying**: Search and list events by various criteria
- **Event Management**: Update or delete existing events

### Tool Parameters

Each tool accepts structured parameters that are validated and processed:

```javascript
{
  title: "Meeting with John",
  startTime: "2024-01-15T10:00:00",
  endTime: "2024-01-15T11:00:00",
  description: "Discuss project updates",
  location: "Conference Room A"
}
```

## Testing

The project maintains 85% code coverage across:

- Unit tests for components and utilities
- Integration tests for API interactions
- Mocked external dependencies

```bash
npm run test:coverage  # Run tests with coverage report
npm run test:watch     # Watch mode for development
```

## Project Structure

```
google-calendar-tool/
├── src/
│   ├── components/     # React components
│   ├── services/       # API integration
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utilities and constants
├── tests/             # Test files
├── .env.example       # Environment template
└── package.json       # Dependencies and scripts
```

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool and development server
- **Google APIs** - Calendar API integration
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code linting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass and coverage remains above 85%
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the CLAUDE.md file for development guidance