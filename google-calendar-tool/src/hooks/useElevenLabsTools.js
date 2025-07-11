import { useState, useEffect, useCallback } from 'react';
import { toolHandler } from '../services/ElevenLabsToolHandler.js';
import { 
  ELEVENLABS_TOOLS, 
  TOOL_RESPONSE_STATUS, 
  ERROR_MESSAGES 
} from '../utils/constants.js';

/**
 * Custom hook for ElevenLabs tool integration
 * @returns {object} Tool handling state and functions
 */
export const useElevenLabsTools = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [toolCallHistory, setToolCallHistory] = useState([]);

  // Initialize tool handler
  useEffect(() => {
    const initializeTools = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await toolHandler.initialize();
        toolHandler.registerEventListeners();
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing ElevenLabs tools:', err);
        setError(err.message);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTools();
  }, []);

  /**
   * Handles a tool call manually
   * @param {string} toolName - Name of the tool
   * @param {object} parameters - Tool parameters
   * @returns {Promise<object>} Tool response
   */
  const handleToolCall = useCallback(async (toolName, parameters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const toolCall = {
        tool_name: toolName,
        parameters
      };
      
      const response = await toolHandler.handleToolCall(toolCall);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        toolName,
        parameters,
        response,
        success: response.success
      };
      
      setToolCallHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50
      setLastResponse(response);
      
      return response;
    } catch (err) {
      console.error('Error handling tool call:', err);
      const errorResponse = {
        success: false,
        data: null,
        message: err.message,
        timestamp: new Date().toISOString()
      };
      
      setError(err.message);
      setLastResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Creates a calendar event via tool call
   * @param {object} eventData - Event data
   * @returns {Promise<object>} Tool response
   */
  const createEvent = useCallback(async (eventData) => {
    return await handleToolCall(ELEVENLABS_TOOLS.CREATE_EVENT, eventData);
  }, [handleToolCall]);

  /**
   * Lists calendar events via tool call
   * @param {object} listOptions - List options
   * @returns {Promise<object>} Tool response
   */
  const listEvents = useCallback(async (listOptions = {}) => {
    return await handleToolCall(ELEVENLABS_TOOLS.LIST_EVENTS, listOptions);
  }, [handleToolCall]);

  /**
   * Manages (updates or deletes) an event via tool call
   * @param {string} eventId - Event ID
   * @param {string} action - Action to perform ('update' or 'delete')
   * @param {object} updateData - Update data (for update action)
   * @returns {Promise<object>} Tool response
   */
  const manageEvent = useCallback(async (eventId, action, updateData = {}) => {
    const parameters = {
      event_id: eventId,
      action,
      ...updateData
    };
    
    return await handleToolCall(ELEVENLABS_TOOLS.MANAGE_EVENT, parameters);
  }, [handleToolCall]);

  /**
   * Updates an event via tool call
   * @param {string} eventId - Event ID
   * @param {object} updateData - Update data
   * @returns {Promise<object>} Tool response
   */
  const updateEvent = useCallback(async (eventId, updateData) => {
    return await manageEvent(eventId, 'update', updateData);
  }, [manageEvent]);

  /**
   * Deletes an event via tool call
   * @param {string} eventId - Event ID
   * @returns {Promise<object>} Tool response
   */
  const deleteEvent = useCallback(async (eventId) => {
    return await manageEvent(eventId, 'delete');
  }, [manageEvent]);

  /**
   * Gets authentication status
   * @returns {Promise<object>} Auth status
   */
  const getAuthStatus = useCallback(async () => {
    try {
      return await toolHandler.getAuthStatus();
    } catch (err) {
      console.error('Error getting auth status:', err);
      return {
        isAuthenticated: false,
        user: null,
        error: err.message
      };
    }
  }, []);

  /**
   * Handles authentication
   * @returns {Promise<void>}
   */
  const authenticate = useCallback(async () => {
    try {
      await toolHandler.handleAuthentication();
    } catch (err) {
      console.error('Error authenticating:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clears tool call history
   */
  const clearHistory = useCallback(() => {
    setToolCallHistory([]);
    setLastResponse(null);
  }, []);

  /**
   * Gets tool call statistics
   * @returns {object} Statistics object
   */
  const getStats = useCallback(() => {
    const total = toolCallHistory.length;
    const successful = toolCallHistory.filter(entry => entry.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    
    const toolCounts = toolCallHistory.reduce((acc, entry) => {
      acc[entry.toolName] = (acc[entry.toolName] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      successful,
      failed,
      successRate: Math.round(successRate),
      toolCounts,
      lastCall: toolCallHistory[0]?.timestamp || null
    };
  }, [toolCallHistory]);

  /**
   * Formats tool response for display
   * @param {object} response - Tool response
   * @returns {object} Formatted response
   */
  const formatResponse = useCallback((response) => {
    if (!response) return null;
    
    return {
      status: response.success ? TOOL_RESPONSE_STATUS.SUCCESS : TOOL_RESPONSE_STATUS.ERROR,
      message: response.message || '',
      data: response.data,
      timestamp: response.timestamp,
      isSuccess: response.success,
      hasData: response.data !== null && response.data !== undefined
    };
  }, []);

  /**
   * Simulates a tool call for testing
   * @param {string} toolName - Tool name
   * @param {object} parameters - Parameters
   * @returns {Promise<object>} Mock response
   */
  const simulateToolCall = useCallback(async (toolName, parameters) => {
    // Mock response for testing
    const mockResponse = {
      success: true,
      data: {
        mockData: true,
        toolName,
        parameters,
        timestamp: new Date().toISOString()
      },
      message: `Mock response for ${toolName}`,
      timestamp: new Date().toISOString()
    };
    
    setLastResponse(mockResponse);
    
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      toolName,
      parameters,
      response: mockResponse,
      success: true,
      isMock: true
    };
    
    setToolCallHistory(prev => [historyEntry, ...prev.slice(0, 49)]);
    
    return mockResponse;
  }, []);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    lastResponse,
    toolCallHistory,
    
    // Tool actions
    handleToolCall,
    createEvent,
    listEvents,
    manageEvent,
    updateEvent,
    deleteEvent,
    
    // Auth actions
    getAuthStatus,
    authenticate,
    
    // Utility actions
    clearError,
    clearHistory,
    getStats,
    formatResponse,
    simulateToolCall,
    
    // Computed values
    hasHistory: toolCallHistory.length > 0,
    historyCount: toolCallHistory.length,
    lastCallSuccess: lastResponse?.success || false,
    isReady: isInitialized && !isLoading && !error
  };
};

export default useElevenLabsTools;