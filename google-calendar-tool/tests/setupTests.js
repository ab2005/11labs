import '@testing-library/jest-dom';

// Mock environment variables
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/callback';
process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';
process.env.ELEVENLABS_AGENT_ID = 'test-agent-id';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  assign: jest.fn(),
  replace: jest.fn(),
};

// Mock window.confirm
window.confirm = jest.fn(() => true);

// Mock window.alert
window.alert = jest.fn();

// Mock fetch
global.fetch = jest.fn();

// Mock Google APIs
global.gapi = {
  load: jest.fn(),
  auth2: {
    getAuthInstance: jest.fn(),
    init: jest.fn(),
  },
  client: {
    init: jest.fn(),
    calendar: {
      events: {
        list: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
      },
      calendarList: {
        list: jest.fn(),
      },
    },
  },
};

// Mock googleapis module
jest.mock('googleapis', () => ({
  google: {
    calendar: jest.fn(() => ({
      events: {
        list: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
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
    })),
    auth: {
      OAuth2: jest.fn(() => ({
        setCredentials: jest.fn(),
        getToken: jest.fn(),
        refreshAccessToken: jest.fn(),
        generateAuthUrl: jest.fn(),
      })),
    },
    oauth2: jest.fn(() => ({
      userinfo: {
        get: jest.fn(),
      },
    })),
  },
}));

// Mock google-auth-library
jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn(() => ({
    OAuth2: jest.fn(() => ({
      setCredentials: jest.fn(),
      getToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      generateAuthUrl: jest.fn(),
    })),
  })),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => new Uint32Array(1)),
  },
});

// Mock URL constructor
global.URL = class URL {
  constructor(url) {
    this.href = url;
    this.origin = 'http://localhost:3000';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
  }
};

// Mock URLSearchParams
global.URLSearchParams = class URLSearchParams {
  constructor(params) {
    this.params = new Map();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        this.params.set(key, value);
      });
    }
  }
  
  get(key) {
    return this.params.get(key);
  }
  
  set(key, value) {
    this.params.set(key, value);
  }
  
  has(key) {
    return this.params.has(key);
  }
  
  toString() {
    return Array.from(this.params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Global test timeout
jest.setTimeout(10000);