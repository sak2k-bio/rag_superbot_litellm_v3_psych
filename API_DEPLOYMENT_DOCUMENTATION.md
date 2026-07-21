# API Deployment Documentation

## Deployed FastAPI LLM Proxy

Base URL: `https://openai-1minai-proxy.onrender.com`

## Endpoint Map

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | No | Service info |
| GET | `/health` | No | Health check |
| GET | `/v1/models` | Yes | List available models |
| POST | `/v1/chat/completions` | Yes | Chat completion (OpenAI format) |
| POST | `/chat/completions` | Yes | Chat completion alias |

## Auth

- **Header**: `Authorization: Bearer <ONEMINAI_API_KEY>`
- **Alternative header**: `API-KEY: <ONEMINAI_API_KEY>`
- **Content-Type**: `application/json`

## Chat Completion Request

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "top_p": 1.0,
  "max_tokens": null,
  "stop": null,
  "stream": false,
  "user": null,
  "response_format": null,
  "tools": null,
  "tool_choice": "auto",
  "conversation_id": null
}
```

### Field Reference

| Field | Type | Required | Default |
|---|---|---|---|
| `model` | string | No | `"gpt-4o-mini"` |
| `messages` | array | Yes | - |
| `temperature` | number | No | `0.7` |
| `top_p` | number | No | `1.0` |
| `max_tokens` | integer or null | No | `null` |
| `stop` | array or null | No | `null` |
| `stream` | boolean | No | `false` |
| `user` | string or null | No | `null` |
| `response_format` | object or null | No | `null` |
| `tools` | array or null | No | `null` |
| `tool_choice` | string | No | `"auto"` |
| `conversation_id` | string or null | No | `null` |

### Messages Item

| Field | Type | Required |
|---|---|---|
| `role` | string | Yes |
| `content` | string or null | No |
| `tool_calls` | array or null | No |
| `tool_call_id` | string or null | No |
| `name` | string or null | No |

## Response

```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## Streaming (SSE)

When `stream: true`, the response is a Server-Sent Events stream with `chat.completion.chunk` events.

## Fallback Chain

If 1minAI fails, the proxy falls through:
1. **OpenRouter** (up to 3 keys: `OPENROUTER_API_KEY[_2/_3]`)
2. **Mistral** (up to 3 keys: `MISTRAL_API_KEY[_2/_3]`)
3. **Gemini** (up to 3 keys: `GEMINI_API_KEY[_2/_3]` / `GOOGLE_API_KEY`)

## Conversation Persistence

- Use `user` field: auto-creates a thread ID (`thread-{user}`)
- Use `conversation_id`: explicit thread UUID

## Supported Models

### OpenAI
- `gpt-4o-mini`, `gpt-4o`, `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- `gpt-5`, `gpt-5-mini`, `gpt-5-nano`
- `gpt-5.1`, `gpt-5.1-codex`, `gpt-5.1-codex-mini`
- `gpt-5.2`, `gpt-5.2-pro`
- `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-nano`, `gpt-5.4-pro`
- `o3`, `o3-mini`, `o4-mini`

### Anthropic
- `claude-3-5-sonnet`, `claude-3-haiku`
- `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-haiku-4-5`

### Google
- `gemini-2.0-flash`, `gemini-2.0-flash-lite`
- `gemini-1.5-flash`, `gemini-1.5-pro`
- `gemini-2.5-flash`, `gemini-2.5-pro`

### Mistral
- `mistral-small-latest`, `mistral-medium-latest`, `mistral-large-latest`

### DeepSeek
- `deepseek-chat`, `deepseek-reasoner`

### Meta
- `llama-3-70b`, `llama-4-scout`, `llama-4-maverick`

### Cohere
- `command-r`

### Perplexity
- `sonar`, `sonar-pro`, `sonar-reasoning-pro`

## Examples

### Basic chat
```bash
curl -X POST https://openai-1minai-proxy.onrender.com/v1/chat/completions \
  -H "Authorization: Bearer $ONEMINAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.7
  }'
```

### Structured output
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "system", "content": "Output JSON."},
    {"role": "user", "content": "Summarize the issue."}
  ],
  "response_format": {"type": "json_object"},
  "temperature": 0.2
}
```

### Multi-turn with persistence
```json
{
  "model": "gpt-4o-mini",
  "messages": [{"role": "user", "content": "My name is Alice."}],
  "user": "alice-session"
}
```
```json
{
  "model": "gpt-4o-mini",
  "messages": [{"role": "user", "content": "What is my name?"}],
  "user": "alice-session"
}
```
