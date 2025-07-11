# Development Guide

## Project Structure

```
google-calendar-tool/
├── src/
│   ├── components/           # React components
│   │   ├── GoogleCalendarTool.js    # Main component
│   │   ├── CalendarAuth.js          # Authentication
│   │   ├── CalendarEventForm.js     # Event creation form
│   │   └── CalendarEventList.js     # Event list display
│   ├── services/            # API services
│   │   ├── GoogleCalendarAPI.js     # Google Calendar API
│   │   ├── ElevenLabsToolHandler.js # ElevenLabs integration
│   │   └── AuthService.js           # Authentication service
│   ├── utils/               # Utility functions
│   │   ├── constants.js            # Application constants
│   │   ├── dateUtils.js            # Date/time utilities
│   │   └── eventUtils.js           # Event processing
│   ├── hooks/               # Custom React hooks
│   │   ├── useGoogleCalendar.js    # Calendar operations
│   │   └── useElevenLabsTools.js   # Tool integration
│   └── index.js             # Application entry point
├── tests/                   # Test files
│   ├── components/          # Component tests
│   ├── services/           # Service tests
│   ├── utils/              # Utility tests
│   └── integration/        # Integration tests
├── package.json            # Dependencies and scripts
├── vite.config.js          # Build configuration
└── README.md               # Project documentation
```

## Architecture

### Component Hierarchy

```
GoogleCalendarTool (Main)
├── CalendarAuth (Authentication)
├── CalendarEventForm (Event Creation)
├── CalendarEventList (Event Display)
│   └── EventCard (Individual events)
└── ToolHistory (ElevenLabs integration)
```

### Data Flow

1. **Authentication Flow**
   - `AuthService` handles Google OAuth 2.0
   - Tokens stored in localStorage
   - Auto-refresh for expired tokens

2. **Calendar Operations**
   - `GoogleCalendarAPI` wraps Google Calendar API
   - `useGoogleCalendar` hook manages state
   - Real-time updates after operations

3. **ElevenLabs Integration**
   - `ElevenLabsToolHandler` processes tool calls
   - `useElevenLabsTools` hook manages tool state
   - Event listeners for widget integration

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Platform account
- ElevenLabs account

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env with your API keys
```

### Development Server

```bash
# Start development server
npm run dev

# Server will start on http://localhost:3000
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Generate coverage report
npm run test:coverage -- --coverage
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Google Calendar API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_AGENT_ID=your-elevenlabs-agent-id

# Development
NODE_ENV=development
PORT=3000
```

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### ElevenLabs Setup

1. Create ElevenLabs account
2. Get API key from dashboard
3. Create conversational AI agent
4. Add the three Google Calendar tools:
   - `google_calendar_create_event`
   - `google_calendar_list_events`
   - `google_calendar_manage_event`

## Code Style

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

### Naming Conventions

- **Components**: PascalCase (`GoogleCalendarTool`)
- **Functions**: camelCase (`handleCreateEvent`)
- **Constants**: UPPER_SNAKE_CASE (`GOOGLE_CALENDAR_CONFIG`)
- **Files**: camelCase with extension (`dateUtils.js`)

## Testing Strategy

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Use Jest and React Testing Library

### Integration Tests

- Test component interactions
- Test API integrations
- Mock external services

### End-to-End Tests

- Test complete user workflows
- Test ElevenLabs integration
- Use real API calls in staging

### Coverage Goals

- **Functions**: 85%+
- **Branches**: 85%+
- **Lines**: 85%+
- **Statements**: 85%+

## Error Handling

### Error Types

1. **Authentication Errors**
   - Token expired
   - Invalid credentials
   - Permission denied

2. **API Errors**
   - Network timeouts
   - Rate limiting
   - Invalid requests

3. **Validation Errors**
   - Invalid event data
   - Missing required fields
   - Invalid date formats

### Error Handling Pattern

```javascript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw this.handleAPIError(error);
}
```

## Performance Optimization

### Best Practices

1. **Lazy Loading**
   - Load components on demand
   - Optimize bundle size

2. **Memoization**
   - Use React.memo for expensive components
   - Use useMemo for expensive calculations

3. **Caching**
   - Cache API responses
   - Use localStorage for tokens

4. **Debouncing**
   - Debounce search inputs
   - Limit API calls

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# View bundle report
npm run preview
```

## Security Considerations

### Authentication

- Use OAuth 2.0 flow
- Store tokens securely
- Implement token refresh
- Validate redirect URIs

### API Security

- Validate all inputs
- Sanitize user data
- Use HTTPS only
- Implement rate limiting

### Data Protection

- Don't log sensitive data
- Encrypt stored tokens
- Follow GDPR compliance
- Implement data retention policies

## Deployment

### Development Deployment

```bash
# Build for development
npm run build

# Start local server
npm run preview
```

### Production Deployment

```bash
# Set production environment
export NODE_ENV=production

# Build for production
npm run build

# Deploy to hosting service
# (Vercel, Netlify, etc.)
```

### Environment-specific Configuration

```javascript
// config/environment.js
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true,
  },
  production: {
    apiUrl: 'https://your-domain.com',
    debug: false,
  },
};

export default config[process.env.NODE_ENV];
```

## Monitoring

### Error Tracking

```javascript
// Setup error tracking
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error tracking service
});
```

### Performance Monitoring

```javascript
// Monitor performance
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('Performance:', entry);
  });
});

observer.observe({ entryTypes: ['measure'] });
```

## Troubleshooting

### Common Issues

1. **Authentication Fails**
   - Check Google OAuth configuration
   - Verify redirect URIs
   - Check API key validity

2. **API Calls Fail**
   - Check network connectivity
   - Verify API permissions
   - Check rate limits

3. **Build Errors**
   - Check Node.js version
   - Clear node_modules and reinstall
   - Check environment variables

### Debug Mode

```javascript
// Enable debug mode
localStorage.setItem('DEBUG', 'true');

// Check debug logs
console.log('Debug info:', debugData);
```

## Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Error handling is implemented
- [ ] Performance is acceptable
- [ ] Security is considered

## Resources

### Documentation

- [Google Calendar API](https://developers.google.com/calendar/api)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [React Documentation](https://reactjs.org/docs)
- [Jest Testing](https://jestjs.io/docs)

### Tools

- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools)
- [Google API Explorer](https://developers.google.com/apis-explorer)
- [Postman](https://www.postman.com/) (API testing)

### Community

- [React Community](https://reactjs.org/community/support.html)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/reactjs)
- [GitHub Issues](https://github.com/your-repo/issues)