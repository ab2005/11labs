import { GoogleAuth } from 'google-auth-library';
import { 
  GOOGLE_CALENDAR_CONFIG, 
  STORAGE_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} from '../utils/constants.js';

/**
 * Authentication service for Google OAuth 2.0
 */
export class AuthService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
    this.scopes = GOOGLE_CALENDAR_CONFIG.SCOPES;
    this.auth = null;
    this.isInitialized = false;
  }

  /**
   * Initializes the Google Auth library
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      if (!this.clientId) {
        throw new Error('Google Client ID not configured');
      }

      // Initialize Google Auth
      this.auth = new GoogleAuth({
        scopes: this.scopes,
        credentials: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uris: [this.redirectUri]
        }
      });

      this.isInitialized = true;
      console.log('Auth service initialized successfully');
    } catch (error) {
      console.error('Error initializing auth service:', error);
      throw new Error(`Failed to initialize authentication: ${error.message}`);
    }
  }

  /**
   * Generates the OAuth 2.0 authorization URL
   * @param {string} state - Optional state parameter for CSRF protection
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(state = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('Auth service not initialized');
      }

      const oauth2Client = new this.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.scopes,
        include_granted_scopes: true,
        state: state || this.generateState()
      });

      return authUrl;
    } catch (error) {
      console.error('Error generating authorization URL:', error);
      throw new Error(`Failed to generate authorization URL: ${error.message}`);
    }
  }

  /**
   * Exchanges authorization code for access token
   * @param {string} authorizationCode - Authorization code from callback
   * @returns {Promise<object>} Token information
   */
  async exchangeCodeForTokens(authorizationCode) {
    try {
      if (!this.isInitialized) {
        throw new Error('Auth service not initialized');
      }

      const oauth2Client = new this.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );

      const { tokens } = await oauth2Client.getToken(authorizationCode);
      
      // Store tokens
      this.storeTokens(tokens);
      
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  /**
   * Refreshes the access token using refresh token
   * @returns {Promise<string>} New access token
   */
  async refreshAccessToken() {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const oauth2Client = new this.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Store new tokens
      this.storeTokens(credentials);
      
      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      // Clear stored tokens if refresh fails
      this.clearStoredTokens();
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Gets a valid access token (refreshes if necessary)
   * @returns {Promise<string>} Valid access token
   */
  async getValidAccessToken() {
    try {
      const storedToken = this.getStoredAccessToken();
      
      if (!storedToken) {
        throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
      }

      // Check if token is expired
      const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      if (expiry) {
        const expiryDate = new Date(expiry);
        const now = new Date();
        
        // If token expires in less than 5 minutes, refresh it
        if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
          console.log('Token expiring soon, refreshing...');
          return await this.refreshAccessToken();
        }
      }

      return storedToken;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      throw error;
    }
  }

  /**
   * Initiates the OAuth flow by redirecting to Google
   * @param {string} state - Optional state parameter
   */
  initiateOAuthFlow(state = null) {
    try {
      const authUrl = this.getAuthorizationUrl(state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      throw error;
    }
  }

  /**
   * Handles the OAuth callback
   * @param {string} code - Authorization code
   * @param {string} state - State parameter
   * @returns {Promise<object>} Token information
   */
  async handleOAuthCallback(code, state) {
    try {
      // Validate state parameter for CSRF protection
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      const tokens = await this.exchangeCodeForTokens(code);
      
      // Clean up state
      sessionStorage.removeItem('oauth_state');
      
      return tokens;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  /**
   * Signs out the user
   */
  signOut() {
    try {
      this.clearStoredTokens();
      
      // Optional: Revoke the token with Google
      const accessToken = this.getStoredAccessToken();
      if (accessToken) {
        this.revokeToken(accessToken);
      }
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }

  /**
   * Revokes the access token with Google
   * @param {string} accessToken - Access token to revoke
   */
  async revokeToken(accessToken) {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        console.warn('Failed to revoke token with Google');
      }
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }

  /**
   * Checks if user is currently authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    try {
      const accessToken = this.getStoredAccessToken();
      const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      
      if (!accessToken || !expiry) {
        return false;
      }

      const expiryDate = new Date(expiry);
      return expiryDate > new Date();
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Gets the current user's profile information
   * @returns {Promise<object>} User profile
   */
  async getUserProfile() {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = await response.json();
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Stores tokens in localStorage
   * @param {object} tokens - Token object from Google
   */
  storeTokens(tokens) {
    try {
      if (tokens.access_token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
      }
      
      if (tokens.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
      }
      
      if (tokens.expiry_date) {
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, new Date(tokens.expiry_date).toISOString());
      } else if (tokens.expires_in) {
        const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000));
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryDate.toISOString());
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  /**
   * Gets stored access token
   * @returns {string|null} Access token or null
   */
  getStoredAccessToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting stored access token:', error);
      return null;
    }
  }

  /**
   * Gets stored refresh token
   * @returns {string|null} Refresh token or null
   */
  getStoredRefreshToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting stored refresh token:', error);
      return null;
    }
  }

  /**
   * Clears all stored tokens
   */
  clearStoredTokens() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    } catch (error) {
      console.error('Error clearing stored tokens:', error);
    }
  }

  /**
   * Generates a random state parameter for CSRF protection
   * @returns {string} Random state string
   */
  generateState() {
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', state);
    return state;
  }

  /**
   * Validates the required environment variables
   * @returns {boolean} True if all required variables are present
   */
  validateConfiguration() {
    const requiredVars = ['GOOGLE_CLIENT_ID'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return false;
    }
    
    return true;
  }
}

// Create singleton instance
export const authService = new AuthService();

// Helper functions for easier usage
export const initializeAuth = () => authService.initialize();
export const getAuthUrl = (state) => authService.getAuthorizationUrl(state);
export const handleCallback = (code, state) => authService.handleOAuthCallback(code, state);
export const signOut = () => authService.signOut();
export const isAuthenticated = () => authService.isAuthenticated();
export const getAccessToken = () => authService.getValidAccessToken();
export const getUserProfile = () => authService.getUserProfile();

export default AuthService;