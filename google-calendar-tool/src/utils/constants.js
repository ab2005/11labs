// Google Calendar API Configuration
export const GOOGLE_CALENDAR_CONFIG = {
  API_VERSION: 'v3',
  SCOPES: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ],
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
};

// ElevenLabs Tool Names
export const ELEVENLABS_TOOLS = {
  CREATE_EVENT: 'google_calendar_create_event',
  LIST_EVENTS: 'google_calendar_list_events',
  MANAGE_EVENT: 'google_calendar_manage_event'
};

// Event Management Actions
export const EVENT_ACTIONS = {
  UPDATE: 'update',
  DELETE: 'delete'
};

// Calendar Event Status
export const EVENT_STATUS = {
  CONFIRMED: 'confirmed',
  TENTATIVE: 'tentative',
  CANCELLED: 'cancelled'
};

// Date/Time Formats
export const DATE_FORMATS = {
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ssXXX",
  ISO_DATE: 'yyyy-MM-dd',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  DISPLAY_DATE: 'MMM d, yyyy'
};

// Default Values
export const DEFAULTS = {
  MAX_RESULTS: 10,
  CALENDAR_ID: 'primary',
  EVENT_DURATION_MINUTES: 60,
  TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'google_calendar_access_token',
  REFRESH_TOKEN: 'google_calendar_refresh_token',
  TOKEN_EXPIRY: 'google_calendar_token_expiry',
  USER_PREFERENCES: 'google_calendar_preferences'
};

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required. Please sign in with Google.',
  INVALID_EVENT_ID: 'Invalid event ID provided.',
  INVALID_DATE_FORMAT: 'Invalid date format. Please use ISO format (YYYY-MM-DDTHH:MM:SS).',
  MISSING_REQUIRED_FIELD: 'Missing required field: ',
  API_ERROR: 'Google Calendar API error occurred.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PERMISSION_DENIED: 'Permission denied. Please check calendar permissions.',
  EVENT_NOT_FOUND: 'Event not found.',
  TOOL_CALL_ERROR: 'Error processing tool call.',
  INVALID_TOOL_NAME: 'Invalid tool name provided.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  EVENT_CREATED: 'Event created successfully!',
  EVENT_UPDATED: 'Event updated successfully!',
  EVENT_DELETED: 'Event deleted successfully!',
  EVENTS_LOADED: 'Events loaded successfully!',
  AUTH_SUCCESS: 'Authentication successful!'
};

// Tool Response Status
export const TOOL_RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PARTIAL: 'partial'
};

// Component States
export const COMPONENT_STATES = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  EMPTY: 'empty'
};

// Event Colors (Google Calendar color IDs)
export const EVENT_COLORS = {
  LAVENDER: '1',
  SAGE: '2',
  GRAPE: '3',
  FLAMINGO: '4',
  BANANA: '5',
  TANGERINE: '6',
  PEACOCK: '7',
  GRAPHITE: '8',
  BLUEBERRY: '9',
  BASIL: '10',
  TOMATO: '11'
};

// Frequency for recurring events
export const RECURRENCE_FREQUENCY = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY'
};

// Notification settings
export const NOTIFICATION_METHODS = {
  EMAIL: 'email',
  POPUP: 'popup',
  SMS: 'sms'
};

// Default notification times (in minutes before event)
export const DEFAULT_REMINDERS = [
  { method: NOTIFICATION_METHODS.POPUP, minutes: 10 },
  { method: NOTIFICATION_METHODS.EMAIL, minutes: 1440 } // 24 hours
];