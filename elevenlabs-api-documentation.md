# ElevenLabs Conversational AI - Full API Endpoints Documentation

## Table of Contents
- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [WebSocket API](#websocket-api)
- [Agents API](#agents-api)
- [Conversations API](#conversations-api)
- [Tools API](#tools-api)
- [Knowledge Base API](#knowledge-base-api)
- [Phone Numbers API](#phone-numbers-api)
- [Widget API](#widget-api)
- [Workspace API](#workspace-api)
- [Error Responses](#error-responses)
- [Rate Limits](#rate-limits)

## Base Configuration

### Base URLs
```
REST API: https://api.elevenlabs.io/v1/convai
WebSocket: wss://api.elevenlabs.io/v1/convai/conversation
```

### Required Headers
```http
xi-api-key: your-api-key-here
Content-Type: application/json
```

### Authentication

All API requests require authentication using your API key in the `xi-api-key` header:

```bash
curl -X GET https://api.elevenlabs.io/v1/convai/agents \
  -H "xi-api-key: your-api-key-here"
```

## WebSocket API

### WebSocket Connection

#### Endpoint
```
wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agent_id}
```

#### Connection Parameters
- `agent_id` (required): The ID of the agent to connect to
- `authorization` (optional): For private agents, use signed URL

#### Connection Example
```javascript
// Public agent
const ws = new WebSocket('wss://api.elevenlabs.io/v1/convai/conversation?agent_id=your-agent-id');

// Private agent with signed URL
const signedUrl = await getSignedUrl(agentId); // Server-side function
const ws = new WebSocket(signedUrl);
```

### WebSocket Messages

#### Client → Server Messages

##### 1. Conversation Initialization
```json
{
  "type": "conversation_initiation_client_data",
  "conversation_config_override": {
    "agent": {
      "prompt": {
        "prompt": "You are a helpful assistant",
        "tool_ids": ["tool-123", "tool-456"]
      },
      "first_message": "Hello! How can I help you today?",
      "language": "en"
    },
    "tts": {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "model_id": "eleven_turbo_v2_5",
      "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.0,
        "use_speaker_boost": true
      },
      "output_format": "pcm_16000"
    },
    "stt": {
      "model": "whisper_large",
      "language": "en"
    },
    "turn": {
      "mode": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 700
    }
  },
  "custom_llm_extra_body": {
    "temperature": 0.7,
    "max_tokens": 150,
    "top_p": 0.9
  },
  "dynamic_variables": {
    "user_name": "John",
    "account_type": "premium",
    "session_id": "sess_123"
  }
}
```

##### 2. Audio Input
```json
{
  "user_audio_chunk": "base64EncodedAudioData=="
}
```

##### 3. Ping (Keep-alive)
```json
{
  "type": "ping"
}
```

##### 4. Interruption Signal
```json
{
  "type": "interruption"
}
```

##### 5. User Input Text (Alternative to Audio)
```json
{
  "type": "user_input",
  "text": "What's the weather like today?"
}
```

#### Server → Client Messages

##### 1. Conversation Metadata
```json
{
  "type": "conversation_initiation_metadata",
  "conversation_initiation_metadata_event": {
    "conversation_id": "conv_123456789",
    "agent_id": "agent_abc123",
    "agent_output_audio_format": "pcm_16000",
    "user_input_audio_format": "pcm_16000",
    "session_id": "sess_xyz789"
  }
}
```

##### 2. Audio Output
```json
{
  "type": "audio",
  "audio_event": {
    "audio_base_64": "SGVsbG8sIHRoaXMgaXMgYSBzYW1wbGUgYXVkaW8gY2h1bms=",
    "event_id": 67890,
    "is_final": false
  }
}
```

##### 3. User Transcript
```json
{
  "type": "user_transcript",
  "user_transcription_event": {
    "user_transcript": "I need help with my order",
    "is_final": true,
    "confidence": 0.95
  }
}
```

##### 4. Agent Response
```json
{
  "type": "agent_response",
  "agent_response_event": {
    "agent_response": "I'd be happy to help you with your order. Can you provide your order number?",
    "is_final": true
  }
}
```

##### 5. Voice Activity Detection
```json
{
  "type": "vad_score",
  "vad_score_event": {
    "vad_score": 0.95
  }
}
```

##### 6. Tentative Response
```json
{
  "type": "internal_tentative_agent_response",
  "tentative_agent_response_internal_event": {
    "tentative_agent_response": "Let me check that for you..."
  }
}
```

##### 7. Tool Call
```json
{
  "type": "tool_call",
  "tool_call_event": {
    "tool_name": "get_order_status",
    "parameters": {
      "order_id": "ORD-12345"
    },
    "tool_call_id": "call_abc123"
  }
}
```

##### 8. Tool Response
```json
{
  "type": "tool_response",
  "tool_response_event": {
    "tool_call_id": "call_abc123",
    "response": {
      "status": "shipped",
      "tracking_number": "1234567890"
    }
  }
}
```

##### 9. Error
```json
{
  "type": "error",
  "error_event": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {}
  }
}
```

##### 10. Pong
```json
{
  "type": "pong"
}
```

## Agents API

### Create Agent
Creates a new conversational AI agent.

```http
POST /agents
```

#### Request Body
```json
{
  "name": "Customer Support Agent",
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "You are a friendly customer support agent for ACME Corp. Help customers with their inquiries professionally and efficiently.",
        "tool_ids": ["tool-123", "tool-456"],
        "built_in_tools": ["end_call", "language_detection"]
      },
      "first_message": "Hello! Welcome to ACME Corp support. How can I assist you today?",
      "language": "en"
    },
    "tts": {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "model_id": "eleven_turbo_v2_5",
      "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.0,
        "use_speaker_boost": true
      }
    },
    "stt": {
      "model": "whisper_large",
      "language_detection": {
        "enabled": true,
        "languages": ["en", "es", "fr"]
      }
    },
    "conversation": {
      "max_duration_seconds": 600,
      "timeout_seconds": 30
    }
  },
  "platform_settings": {
    "auth": {
      "enable_auth": true,
      "allowed_origins": [
        "https://example.com",
        "https://app.example.com"
      ]
    },
    "webhook": {
      "url": "https://example.com/webhooks/conversation",
      "events": ["conversation_ended", "error"]
    }
  }
}
```

#### Response
```json
{
  "agent_id": "agent_abc123xyz",
  "name": "Customer Support Agent",
  "created_at": "2025-01-15T10:00:00Z",
  "conversation_config": { /* ... */ },
  "platform_settings": { /* ... */ }
}
```

### Get Agent
Retrieves details of a specific agent.

```http
GET /agents/{agent_id}
```

#### Response
```json
{
  "agent_id": "agent_abc123xyz",
  "name": "Customer Support Agent",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z",
  "conversation_config": { /* ... */ },
  "platform_settings": { /* ... */ },
  "is_public": false,
  "is_active": true
}
```

### Update Agent
Updates an existing agent's configuration.

```http
PATCH /agents/{agent_id}
```

#### Request Body (Partial Update)
```json
{
  "name": "Updated Support Agent",
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "Updated prompt with new instructions"
      }
    }
  }
}
```

### Delete Agent
Deletes an agent permanently.

```http
DELETE /agents/{agent_id}
```

#### Response
```json
{
  "message": "Agent deleted successfully",
  "agent_id": "agent_abc123xyz"
}
```

### List Agents
Retrieves all agents in your account.

```http
GET /agents
```

#### Query Parameters
- `page` (optional): Page number (default: 0)
- `page_size` (optional): Items per page (default: 20, max: 100)
- `order_by` (optional): Sort field (created_at, updated_at, name)
- `order_direction` (optional): asc or desc

#### Response
```json
{
  "agents": [
    {
      "agent_id": "agent_123",
      "name": "Support Agent",
      "created_at": "2025-01-15T10:00:00Z",
      "is_public": false,
      "is_active": true
    }
  ],
  "pagination": {
    "page": 0,
    "page_size": 20,
    "total_count": 45,
    "total_pages": 3
  }
}
```

### Get Signed URL
Generates a signed URL for secure client connections.

```http
GET /agents/{agent_id}/signed-url
```

#### Response
```json
{
  "signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=agent_123&token=abc...",
  "expires_at": "2025-01-15T11:00:00Z"
}
```

## Conversations API

### Get Conversation
Retrieves details of a specific conversation.

```http
GET /conversations/{conversation_id}
```

#### Response
```json
{
  "conversation_id": "conv_123456789",
  "agent_id": "agent_abc123",
  "status": "done",
  "created_at": "2025-01-15T10:00:00Z",
  "ended_at": "2025-01-15T10:05:00Z",
  "duration_seconds": 300,
  "transcript": [
    {
      "role": "user",
      "message": "Hello, I need help with my order",
      "timestamp": "2025-01-15T10:00:00Z"
    },
    {
      "role": "agent",
      "message": "I'd be happy to help you with your order",
      "timestamp": "2025-01-15T10:00:01Z"
    }
  ],
  "metadata": {
    "user_id": "user_xyz789",
    "session_id": "sess_abc123",
    "language": "en",
    "call_sid": null
  },
  "analysis": {
    "sentiment": "positive",
    "topics": ["order_inquiry", "customer_support"],
    "resolution_status": "resolved"
  },
  "has_audio": true,
  "has_user_audio": true,
  "has_response_audio": true
}
```

### List Conversations
Retrieves all conversations.

```http
GET /conversations
```

#### Query Parameters
- `agent_id` (optional): Filter by agent
- `status` (optional): initiated, in-progress, processing, done, failed
- `start_date` (optional): ISO 8601 date
- `end_date` (optional): ISO 8601 date
- `page` (optional): Page number
- `page_size` (optional): Items per page

#### Response
```json
{
  "conversations": [
    {
      "conversation_id": "conv_123",
      "agent_id": "agent_abc",
      "status": "done",
      "created_at": "2025-01-15T10:00:00Z",
      "duration_seconds": 120
    }
  ],
  "pagination": {
    "page": 0,
    "page_size": 20,
    "total_count": 150
  }
}
```

### Send Conversation Feedback
Provides feedback for a completed conversation.

```http
POST /conversations/{conversation_id}/feedback
```

#### Request Body
```json
{
  "rating": 5,
  "feedback_text": "Excellent service!",
  "categories": ["helpful", "professional", "quick_resolution"]
}
```

### Outbound Call via Twilio
Initiates an outbound call using a Twilio integration.

```http
POST /conversations/outbound-call
```

#### Request Body
```json
{
  "agent_id": "agent_abc123",
  "to_number": "+1234567890",
  "from_number": "+0987654321",
  "initial_message": "Hello, this is ACME Corp calling about your recent inquiry",
  "metadata": {
    "customer_id": "cust_123",
    "call_reason": "follow_up"
  }
}
```

## Tools API

### Create Tool
Creates a new tool for agents to use.

```http
POST /tools
```

#### Request Body - Server Tool (Webhook)
```json
{
  "type": "server",
  "name": "get_weather",
  "description": "Get current weather information for a location",
  "server_tool": {
    "url": "https://api.example.com/weather/{location}",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer {api_key}",
      "Content-Type": "application/json"
    },
    "parameters": [
      {
        "name": "location",
        "type": "string",
        "description": "City name or coordinates",
        "required": true,
        "location": "path"
      },
      {
        "name": "units",
        "type": "string",
        "description": "Temperature units (celsius or fahrenheit)",
        "required": false,
        "location": "query",
        "default": "celsius"
      }
    ],
    "response_schema": {
      "type": "object",
      "properties": {
        "temperature": { "type": "number" },
        "condition": { "type": "string" },
        "humidity": { "type": "number" }
      }
    }
  }
}
```

#### Request Body - Client Tool
```json
{
  "type": "client",
  "name": "play_sound",
  "description": "Play a sound effect on the client device",
  "client_tool": {
    "parameters": [
      {
        "name": "sound_type",
        "type": "string",
        "description": "Type of sound to play",
        "required": true,
        "enum": ["notification", "success", "error", "warning"]
      },
      {
        "name": "volume",
        "type": "number",
        "description": "Volume level (0-1)",
        "required": false,
        "default": 0.5
      }
    ],
    "event_name": "play_sound_effect"
  }
}
```

#### Response
```json
{
  "tool_id": "tool_xyz789",
  "type": "server",
  "name": "get_weather",
  "created_at": "2025-01-15T10:00:00Z"
}
```

### Get Tool
Retrieves details of a specific tool.

```http
GET /tools/{tool_id}
```

### Update Tool
Updates an existing tool.

```http
PATCH /tools/{tool_id}
```

### Delete Tool
Deletes a tool.

```http
DELETE /tools/{tool_id}
```

### List Tools
Retrieves all tools.

```http
GET /tools
```

#### Query Parameters
- `type` (optional): server or client
- `page` (optional): Page number
- `page_size` (optional): Items per page

## Knowledge Base API

### Create Knowledge Base Document from File
Uploads a file to the agent's knowledge base.

```http
POST /agents/{agent_id}/knowledge-base/file
```

#### Request Body (multipart/form-data)
```
file: (binary file - PDF, DOCX, TXT, HTML, EPUB)
name: "Product Manual"
description: "Complete product documentation"
metadata: {"version": "2.0", "category": "documentation"}
```

#### Response
```json
{
  "document_id": "doc_abc123",
  "name": "Product Manual",
  "type": "file",
  "status": "processing",
  "created_at": "2025-01-15T10:00:00Z"
}
```

### Create Knowledge Base Document from URL
Adds a URL to the agent's knowledge base.

```http
POST /agents/{agent_id}/knowledge-base/url
```

#### Request Body
```json
{
  "url": "https://docs.example.com/api-reference",
  "name": "API Documentation",
  "description": "Complete API reference",
  "metadata": {
    "section": "technical",
    "last_updated": "2025-01-01"
  }
}
```

### Create Knowledge Base Document from Text
Adds text content to the agent's knowledge base.

```http
POST /agents/{agent_id}/knowledge-base/text
```

#### Request Body
```json
{
  "text": "This is the knowledge base content...",
  "name": "FAQ Answers",
  "description": "Frequently asked questions and answers",
  "metadata": {
    "category": "support",
    "priority": "high"
  }
}
```

### List Knowledge Base Documents
Retrieves all documents in an agent's knowledge base.

```http
GET /agents/{agent_id}/knowledge-base
```

#### Response
```json
{
  "documents": [
    {
      "document_id": "doc_123",
      "name": "Product Manual",
      "type": "file",
      "status": "ready",
      "created_at": "2025-01-15T10:00:00Z",
      "metadata": {}
    }
  ],
  "total_count": 25
}
```

### Get Knowledge Base Document
Retrieves details of a specific document.

```http
GET /agents/{agent_id}/knowledge-base/{document_id}
```

### Delete Knowledge Base Document
Removes a document from the knowledge base.

```http
DELETE /agents/{agent_id}/knowledge-base/{document_id}
```

### Compute RAG Index
Triggers recomputation of the RAG (Retrieval-Augmented Generation) index.

```http
POST /agents/{agent_id}/knowledge-base/compute-index
```

#### Response
```json
{
  "status": "indexing_started",
  "estimated_time_seconds": 120
}
```

### Get Document Content
Retrieves the full content of a knowledge base document.

```http
GET /agents/{agent_id}/knowledge-base/{document_id}/content
```

### Get Document Chunk
Retrieves a specific chunk of a document.

```http
GET /agents/{agent_id}/knowledge-base/{document_id}/chunks/{chunk_id}
```

## Phone Numbers API

### Create Phone Number
Assigns a new phone number to an agent.

```http
POST /phone-numbers
```

#### Request Body
```json
{
  "agent_id": "agent_abc123",
  "area_code": "415",
  "country": "US",
  "capabilities": {
    "voice": true,
    "sms": false
  },
  "webhook_url": "https://example.com/phone-webhook"
}
```

#### Response
```json
{
  "phone_number_id": "pn_xyz789",
  "phone_number": "+14155551234",
  "agent_id": "agent_abc123",
  "status": "active",
  "created_at": "2025-01-15T10:00:00Z"
}
```

### List Phone Numbers
Retrieves all phone numbers in your account.

```http
GET /phone-numbers
```

#### Query Parameters
- `agent_id` (optional): Filter by agent
- `status` (optional): active, inactive, released

#### Response
```json
{
  "phone_numbers": [
    {
      "phone_number_id": "pn_123",
      "phone_number": "+14155551234",
      "agent_id": "agent_abc",
      "status": "active"
    }
  ]
}
```

### Get Phone Number
Retrieves details of a specific phone number.

```http
GET /phone-numbers/{phone_number_id}
```

### Update Phone Number
Updates phone number configuration.

```http
PATCH /phone-numbers/{phone_number_id}
```

#### Request Body
```json
{
  "agent_id": "agent_new123",
  "webhook_url": "https://example.com/new-webhook",
  "greeting_message": "Thank you for calling ACME Corp"
}
```

### Delete Phone Number
Releases a phone number.

```http
DELETE /phone-numbers/{phone_number_id}
```

## Widget API

### Get Widget
Retrieves widget configuration for embedding.

```http
GET /agents/{agent_id}/widget
```

#### Response
```json
{
  "widget_id": "widget_abc123",
  "agent_id": "agent_xyz789",
  "embed_code": "<script src='https://widget.elevenlabs.io/v1/embed.js' data-agent-id='agent_xyz789'></script>",
  "config": {
    "position": "bottom-right",
    "theme": "dark",
    "launcher_text": "Chat with us",
    "avatar_url": "https://example.com/avatar.png"
  }
}
```

### Create Widget Avatar
Uploads a custom avatar for the widget.

```http
POST /agents/{agent_id}/widget/avatar
```

#### Request Body (multipart/form-data)
```
file: (binary image file - PNG, JPG, GIF)
```

## Workspace API

### Get Settings
Retrieves workspace settings.

```http
GET /workspace/settings
```

#### Response
```json
{
  "workspace_id": "ws_123",
  "name": "ACME Corp",
  "settings": {
    "data_retention_days": 90,
    "gdpr_compliant": true,
    "eu_data_residency": false,
    "allowed_llm_providers": ["openai", "anthropic", "google"],
    "default_voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }
}
```

### Update Settings
Updates workspace settings.

```http
PATCH /workspace/settings
```

#### Request Body
```json
{
  "settings": {
    "data_retention_days": 60,
    "eu_data_residency": true
  }
}
```

### Get Secrets
Retrieves all stored secrets (keys only, not values).

```http
GET /workspace/secrets
```

#### Response
```json
{
  "secrets": [
    {
      "secret_id": "secret_123",
      "name": "OPENAI_API_KEY",
      "created_at": "2025-01-15T10:00:00Z",
      "last_used": "2025-01-15T11:00:00Z"
    }
  ]
}
```

### Create Secret
Stores a new secret securely.

```http
POST /workspace/secrets
```

#### Request Body
```json
{
  "name": "WEATHER_API_KEY",
  "value": "your-secret-key-here",
  "description": "API key for weather service"
}
```

### Delete Secret
Removes a stored secret.

```http
DELETE /workspace/secrets/{secret_id}
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "agent.prompt",
      "issue": "Prompt cannot be empty"
    }
  },
  "request_id": "req_abc123"
}
```

### Common Error Codes
- `AUTHENTICATION_ERROR`: Invalid or missing API key
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `QUOTA_EXCEEDED`: Usage limit reached

## Rate Limits

### Default Limits
- **REST API**: 100 requests per minute
- **WebSocket Connections**: 50 concurrent connections
- **Audio Processing**: 1000 minutes per hour

### Headers
Response headers include rate limit information:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642089600
```

### Best Practices
1. Implement exponential backoff for retries
2. Cache responses when appropriate
3. Use webhooks instead of polling
4. Batch operations when possible

## Pagination

All list endpoints support pagination:

```http
GET /agents?page=0&page_size=20
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 0,
    "page_size": 20,
    "total_count": 150,
    "total_pages": 8,
    "has_more": true
  }
}
```

## Webhooks

Configure webhooks to receive real-time events:

### Event Types
- `conversation.started`
- `conversation.ended`
- `conversation.error`
- `tool.called`
- `agent.updated`
- `knowledge_base.updated`

### Webhook Payload
```json
{
  "event": "conversation.ended",
  "timestamp": "2025-01-15T10:00:00Z",
  "data": {
    "conversation_id": "conv_123",
    "agent_id": "agent_abc",
    "duration_seconds": 120
  }
}
```

### Webhook Security
Verify webhook signatures using the `X-ElevenLabs-Signature` header:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
```