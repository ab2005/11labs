import React from 'react';
import { createRoot } from 'react-dom/client';
import GoogleCalendarTool from './components/GoogleCalendarTool.js';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Main App component
const App = () => {
  return (
    <div className="app">
      <GoogleCalendarTool />
      
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                       'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        
        .app {
          min-height: 100vh;
          padding: 20px;
        }
        
        button {
          font-family: inherit;
        }
        
        input, textarea, select {
          font-family: inherit;
        }
        
        /* Utility classes */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        .visually-hidden {
          position: absolute !important;
          height: 1px;
          width: 1px;
          overflow: hidden;
          clip: rect(1px, 1px, 1px, 1px);
        }
        
        /* Focus styles for accessibility */
        button:focus,
        input:focus,
        textarea:focus,
        select:focus {
          outline: 2px solid #4285f4;
          outline-offset: 2px;
        }
        
        /* Print styles */
        @media print {
          .app {
            background: white;
            color: black;
          }
          
          button {
            display: none;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .app {
            background: white;
            color: black;
          }
          
          button {
            border: 2px solid currentColor;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

// Initialize the app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// Development hot reload
if (module.hot) {
  module.hot.accept('./components/GoogleCalendarTool.js', () => {
    root.render(<App />);
  });
}

export default App;