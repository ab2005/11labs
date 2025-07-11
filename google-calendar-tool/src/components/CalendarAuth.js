import React, { useState, useEffect } from 'react';
import { authService } from '../services/AuthService.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants.js';

const CalendarAuth = ({ onAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.initialize();
      
      if (authService.isAuthenticated()) {
        const profile = await authService.getUserProfile();
        setUser(profile);
        setIsAuthenticated(true);
        onAuthChange?.(true, profile);
      } else {
        setIsAuthenticated(false);
        onAuthChange?.(false, null);
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
      setError(err.message);
      setIsAuthenticated(false);
      onAuthChange?.(false, null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      authService.initiateOAuthFlow();
    } catch (err) {
      console.error('Error initiating sign in:', err);
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      authService.signOut();
      setIsAuthenticated(false);
      setUser(null);
      onAuthChange?.(false, null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-container loading">
        <div className="auth-spinner"></div>
        <p>Initializing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container error">
        <div className="auth-error">
          <h3>Authentication Error</h3>
          <p>{error}</p>
          <button onClick={initializeAuth} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {isAuthenticated ? (
        <div className="auth-success">
          <div className="user-info">
            {user?.picture && (
              <img 
                src={user.picture} 
                alt="User avatar" 
                className="user-avatar"
              />
            )}
            <div className="user-details">
              <h3>Welcome, {user?.name || 'User'}!</h3>
              <p className="user-email">{user?.email}</p>
              <p className="auth-status">
                ✅ Connected to Google Calendar
              </p>
            </div>
          </div>
          <button onClick={handleSignOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      ) : (
        <div className="auth-required">
          <div className="auth-prompt">
            <h3>Google Calendar Access Required</h3>
            <p>
              To use Google Calendar features, please sign in with your Google account.
              This will allow the tool to create, read, and manage your calendar events.
            </p>
            <div className="permissions-info">
              <h4>Permissions needed:</h4>
              <ul>
                <li>View your calendar events</li>
                <li>Create new events</li>
                <li>Edit existing events</li>
                <li>Delete events</li>
              </ul>
            </div>
            <button onClick={handleSignIn} className="sign-in-button">
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google"
                className="google-logo"
              />
              Sign in with Google
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .auth-container {
          padding: 20px;
          border-radius: 8px;
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          margin-bottom: 20px;
        }
        
        .auth-container.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
        }
        
        .auth-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #4285f4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .auth-container.error {
          background: #fff5f5;
          border-color: #fed7d7;
        }
        
        .auth-error {
          text-align: center;
        }
        
        .auth-error h3 {
          color: #e53e3e;
          margin: 0 0 10px 0;
        }
        
        .auth-error p {
          color: #744210;
          margin: 0 0 15px 0;
        }
        
        .retry-button {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .retry-button:hover {
          background: #c53030;
        }
        
        .auth-success {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid #4285f4;
        }
        
        .user-details h3 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 16px;
        }
        
        .user-email {
          margin: 0 0 5px 0;
          color: #666;
          font-size: 14px;
        }
        
        .auth-status {
          margin: 0;
          color: #34a853;
          font-size: 14px;
          font-weight: 500;
        }
        
        .sign-out-button {
          background: #ea4335;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .sign-out-button:hover {
          background: #d33b2c;
        }
        
        .auth-required {
          text-align: center;
        }
        
        .auth-prompt h3 {
          color: #333;
          margin: 0 0 15px 0;
        }
        
        .auth-prompt p {
          color: #666;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }
        
        .permissions-info {
          background: #f0f8ff;
          border: 1px solid #b3d9ff;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
          text-align: left;
        }
        
        .permissions-info h4 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 14px;
        }
        
        .permissions-info ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .permissions-info li {
          color: #666;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .sign-in-button {
          background: #4285f4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 auto;
        }
        
        .sign-in-button:hover {
          background: #357ae8;
        }
        
        .google-logo {
          width: 20px;
          height: 20px;
        }
        
        @media (max-width: 600px) {
          .auth-success {
            flex-direction: column;
            text-align: center;
          }
          
          .user-info {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarAuth;