import { GoogleCalendarAPI } from './GoogleCalendarAPI.js';
import { authService } from './AuthService.js';
import { 
  ELEVENLABS_TOOLS, 
  EVENT_ACTIONS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  TOOL_RESPONSE_STATUS 
} from '../utils/constants.js';
import { 
  validateToolCall, 
  createToolResponse, 
  formatEventForDisplay 
} from '../utils/eventUtils.js';
import { formatForDisplay } from '../utils/dateUtils.js';

/**
 * ElevenLabs tool handler for Google Calendar operations
 */
export class ElevenLabsToolHandler {
  constructor() {
    this.calendarAPI = null;
    this.isInitialized = false;
    this.toolHandlers = {
      [ELEVENLABS_TOOLS.CREATE_EVENT]: this.handleCreateEvent.bind(this),
      [ELEVENLABS_TOOLS.LIST_EVENTS]: this.handleListEvents.bind(this),
      [ELEVENLABS_TOOLS.MANAGE_EVENT]: this.handleManageEvent.bind(this)
    };
  }

  /**
   * Initializes the tool handler
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      await authService.initialize();
      
      if (!authService.isAuthenticated()) {
        throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
      }

      const accessToken = await authService.getValidAccessToken();
      this.calendarAPI = new GoogleCalendarAPI(accessToken);
      
      this.isInitialized = true;
      console.log('ElevenLabs tool handler initialized successfully');
    } catch (error) {
      console.error('Error initializing tool handler:', error);
      throw error;
    }
  }

  /**
   * Handles incoming tool calls from ElevenLabs
   * @param {object} toolCall - Tool call object
   * @returns {Promise<object>} Tool response
   */
  async handleToolCall(toolCall) {
    try {
      const { tool_name, parameters = {} } = toolCall;
      
      // Validate tool call
      const validation = validateToolCall(tool_name, parameters);
      if (!validation.isValid) {
        return createToolResponse(
          false, 
          null, 
          `Validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Ensure handler is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Handle the tool call
      const handler = this.toolHandlers[tool_name];
      if (!handler) {
        return createToolResponse(
          false, 
          null, 
          `Unknown tool: ${tool_name}`
        );
      }

      const result = await handler(parameters);
      return result;
    } catch (error) {
      console.error('Error handling tool call:', error);
      return createToolResponse(
        false, 
        null, 
        `${ERROR_MESSAGES.TOOL_CALL_ERROR}: ${error.message}`
      );
    }
  }

  /**
   * Handles create event tool call
   * @param {object} parameters - Event parameters
   * @returns {Promise<object>} Tool response
   */
  async handleCreateEvent(parameters) {
    try {
      const event = await this.calendarAPI.createEvent(parameters);
      const formattedEvent = formatEventForDisplay(event);
      
      return createToolResponse(
        true, 
        {
          event: formattedEvent,
          eventId: event.id,
          htmlLink: event.htmlLink
        }, 
        `${SUCCESS_MESSAGES.EVENT_CREATED} "${formattedEvent.title}" scheduled for ${formatForDisplay(formattedEvent.start)}`
      );
    } catch (error) {
      console.error('Error creating event:', error);
      return createToolResponse(
        false, 
        null, 
        `Failed to create event: ${error.message}`
      );
    }
  }

  /**
   * Handles list events tool call
   * @param {object} parameters - List parameters
   * @returns {Promise<object>} Tool response
   */
  async handleListEvents(parameters) {
    try {
      const {
        start_date,
        end_date,
        max_results,
        calendar_id
      } = parameters;

      const events = await this.calendarAPI.listEvents({
        timeMin: start_date,
        timeMax: end_date,
        maxResults: max_results,
        calendarId: calendar_id
      });

      const formattedEvents = events.map(formatEventForDisplay);
      
      const summary = this.createEventsSummary(formattedEvents, start_date, end_date);
      
      return createToolResponse(
        true, 
        {
          events: formattedEvents,
          count: formattedEvents.length,
          summary
        }, 
        `Found ${formattedEvents.length} events. ${summary}`
      );
    } catch (error) {
      console.error('Error listing events:', error);
      return createToolResponse(
        false, 
        null, 
        `Failed to list events: ${error.message}`
      );
    }
  }

  /**
   * Handles manage event tool call (update or delete)
   * @param {object} parameters - Management parameters
   * @returns {Promise<object>} Tool response
   */
  async handleManageEvent(parameters) {
    try {
      const { event_id, action } = parameters;
      
      if (action === EVENT_ACTIONS.DELETE) {
        return await this.handleDeleteEvent(event_id);
      } else if (action === EVENT_ACTIONS.UPDATE) {
        return await this.handleUpdateEvent(event_id, parameters);
      } else {
        return createToolResponse(
          false, 
          null, 
          `Invalid action: ${action}. Use 'update' or 'delete'`
        );
      }
    } catch (error) {
      console.error('Error managing event:', error);
      return createToolResponse(
        false, 
        null, 
        `Failed to manage event: ${error.message}`
      );
    }
  }

  /**
   * Handles event deletion
   * @param {string} eventId - Event ID to delete
   * @returns {Promise<object>} Tool response
   */
  async handleDeleteEvent(eventId) {
    try {
      // Get event details before deletion for confirmation
      const event = await this.calendarAPI.getEvent(eventId);
      const formattedEvent = formatEventForDisplay(event);
      
      await this.calendarAPI.deleteEvent(eventId);
      
      return createToolResponse(
        true, 
        {
          deletedEvent: formattedEvent,
          eventId
        }, 
        `${SUCCESS_MESSAGES.EVENT_DELETED} "${formattedEvent.title}" has been cancelled`
      );
    } catch (error) {
      console.error('Error deleting event:', error);
      return createToolResponse(
        false, 
        null, 
        `Failed to delete event: ${error.message}`
      );
    }
  }

  /**
   * Handles event updates
   * @param {string} eventId - Event ID to update
   * @param {object} parameters - Update parameters
   * @returns {Promise<object>} Tool response
   */
  async handleUpdateEvent(eventId, parameters) {
    try {
      // Extract update fields (exclude event_id and action)
      const { event_id, action, ...updateData } = parameters;
      
      const updatedEvent = await this.calendarAPI.updateEvent(eventId, updateData);
      const formattedEvent = formatEventForDisplay(updatedEvent);
      
      return createToolResponse(
        true, 
        {
          event: formattedEvent,
          eventId: updatedEvent.id,
          htmlLink: updatedEvent.htmlLink
        }, 
        `${SUCCESS_MESSAGES.EVENT_UPDATED} "${formattedEvent.title}" updated successfully`
      );
    } catch (error) {
      console.error('Error updating event:', error);
      return createToolResponse(
        false, 
        null, 
        `Failed to update event: ${error.message}`
      );
    }
  }

  /**
   * Creates a human-readable summary of events
   * @param {array} events - Array of events
   * @param {string} startDate - Start date of query
   * @param {string} endDate - End date of query
   * @returns {string} Summary text
   */
  createEventsSummary(events, startDate, endDate) {
    if (events.length === 0) {
      return 'No events found for the specified period.';
    }

    const now = new Date();
    const upcoming = events.filter(event => new Date(event.start) > now);
    const past = events.filter(event => new Date(event.end) < now);
    const current = events.filter(event => 
      new Date(event.start) <= now && new Date(event.end) > now
    );

    let summary = '';
    
    if (current.length > 0) {
      summary += `Currently in ${current.length} event${current.length > 1 ? 's' : ''}. `;
    }
    
    if (upcoming.length > 0) {
      summary += `${upcoming.length} upcoming event${upcoming.length > 1 ? 's' : ''}. `;
    }
    
    if (past.length > 0) {
      summary += `${past.length} past event${past.length > 1 ? 's' : ''}. `;
    }

    // Add next event info if available
    if (upcoming.length > 0) {
      const nextEvent = upcoming[0];
      summary += `Next: "${nextEvent.title}" at ${formatForDisplay(nextEvent.start)}.`;
    }

    return summary.trim();
  }

  /**
   * Registers event listeners for ElevenLabs widget tool calls
   */
  registerEventListeners() {
    // Listen for tool calls from ElevenLabs widget
    window.addEventListener('elevenlabs-tool-call', async (event) => {
      try {
        const { tool_name, parameters, callback } = event.detail;
        
        const response = await this.handleToolCall({
          tool_name,
          parameters
        });
        
        // Call back to ElevenLabs with response
        if (callback && typeof callback === 'function') {
          callback(response);
        }
      } catch (error) {
        console.error('Error handling ElevenLabs tool call:', error);
        
        if (event.detail.callback) {
          event.detail.callback(createToolResponse(
            false, 
            null, 
            ERROR_MESSAGES.TOOL_CALL_ERROR
          ));
        }
      }
    });

    console.log('ElevenLabs tool call event listeners registered');
  }

  /**
   * Sends a tool response back to ElevenLabs
   * @param {object} response - Tool response object
   */
  sendToolResponse(response) {
    try {
      // Dispatch custom event for ElevenLabs widget
      window.dispatchEvent(new CustomEvent('elevenlabs-tool-response', {
        detail: response
      }));
    } catch (error) {
      console.error('Error sending tool response:', error);
    }
  }

  /**
   * Gets the current authentication status
   * @returns {Promise<object>} Auth status information
   */
  async getAuthStatus() {
    try {
      const isAuthenticated = authService.isAuthenticated();
      
      if (!isAuthenticated) {
        return {
          isAuthenticated: false,
          user: null,
          error: ERROR_MESSAGES.AUTH_REQUIRED
        };
      }

      const user = await authService.getUserProfile();
      
      return {
        isAuthenticated: true,
        user: {
          name: user.name,
          email: user.email,
          picture: user.picture
        },
        error: null
      };
    } catch (error) {
      console.error('Error getting auth status:', error);
      return {
        isAuthenticated: false,
        user: null,
        error: error.message
      };
    }
  }

  /**
   * Handles authentication flow
   * @returns {Promise<void>}
   */
  async handleAuthentication() {
    try {
      if (authService.isAuthenticated()) {
        await this.initialize();
        return;
      }

      // Start OAuth flow
      authService.initiateOAuthFlow();
    } catch (error) {
      console.error('Error handling authentication:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const toolHandler = new ElevenLabsToolHandler();

// Helper functions
export const initializeToolHandler = () => toolHandler.initialize();
export const handleToolCall = (toolCall) => toolHandler.handleToolCall(toolCall);
export const registerToolListeners = () => toolHandler.registerEventListeners();
export const getAuthStatus = () => toolHandler.getAuthStatus();
export const authenticate = () => toolHandler.handleAuthentication();

export default ElevenLabsToolHandler;