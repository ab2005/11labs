# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
cd google-calendar-tool
npm install              # Install dependencies
npm run dev             # Start development server (port 3000)
npm run build           # Production build
npm run test            # Run all tests
npm run test:coverage   # Run tests with coverage report (85% threshold)
npm run lint            # Run ESLint
```

### Testing Specific Components
```bash
npm test -- --testNamePattern="GoogleCalendarTool"    # Test specific component
npm test -- --watch                                   # Watch mode
npm test -- --coverage --watchAll=false               # Coverage in CI
```

## Architecture Overview

This is a **Google Calendar integration tool for ElevenLabs conversational AI** that enables AI agents to manage calendar events through voice interactions.

### Core Architecture

**Component Hierarchy:**
```
GoogleCalendarTool (Main Container)
├── CalendarAuth (OAuth authentication)
├── CalendarEventForm (Event creation/editing)
├── CalendarEventList (Event display)
└── ToolHistory (ElevenLabs integration history)
```

**Service Layer:**
- `GoogleCalendarAPI` - Wraps Google Calendar API operations
- `ElevenLabsToolHandler` - Processes tool calls from ElevenLabs AI
- `AuthService` - Manages OAuth 2.0 authentication flow

**State Management:**
- `useGoogleCalendar` - Calendar operations and state
- `useElevenLabsTools` - Tool integration state management

### ElevenLabs Integration

The system handles three primary tool types:
1. `google_calendar_create_event` - Event creation
2. `google_calendar_list_events` - Event querying
3. `google_calendar_manage_event` - Event updates/deletion

Tool calls are processed through `ElevenLabsToolHandler.js` which validates parameters, executes operations, and returns formatted responses.

### Key Configuration

**Environment Variables (in google-calendar-tool/.env):**
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret  
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `ELEVENLABS_AGENT_ID` - Agent identifier

**Constants:** All configuration values are centralized in `src/utils/constants.js`

### Authentication Flow

Uses Google OAuth 2.0 with:
- Authorization code flow
- Token refresh management
- Secure token storage in localStorage
- Permission validation for calendar access

### Testing Strategy

- **Unit Tests:** Components and utilities
- **Integration Tests:** API interactions with mocked services
- **Coverage:** 85% threshold requirement
- **Mocking:** External dependencies (Google APIs, ElevenLabs)

### File Structure Significance

- `/src/components/` - React components with JSX styling
- `/src/services/` - API integration and business logic
- `/src/hooks/` - Custom React hooks for state management
- `/src/utils/` - Utility functions and constants
- `/tests/` - Test files mirroring src structure
- `vite.config.js` - Build configuration with path aliases

### Development Workflow

1. **Local Development:** Uses Vite dev server with HMR
2. **API Integration:** Google Calendar API v3 with googleapis library
3. **Event Communication:** Custom events for ElevenLabs widget integration
4. **Error Handling:** Comprehensive error translation and user feedback

### Performance Considerations

- React optimizations with useCallback for expensive operations
- API response caching and batch operations
- Vite's built-in optimizations for production builds