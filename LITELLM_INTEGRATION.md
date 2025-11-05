# LiteLLM Integration Guide - RAG Superbot

## Overview

This document describes the integration of **LiteLLM proxy with 1minAI** into the RAG Superbot application. The integration replaces direct Google Gemini API calls with a FastAPI/LiteLLM proxy server that routes requests to 1minAI's free API service.

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (RAG Superbot) │
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌─────────────────────┐
│  FastAPI Server     │
│  (LiteLLM Proxy)    │
│  localhost:8000     │
└────────┬────────────┘
         │
         │ 1minAI API
         ▼
┌─────────────────────┐
│   1minAI Service    │
│  api.1min.ai        │
└─────────────────────┘
```

### Components

1. **FastAPI LiteLLM Proxy** (`fastapi_server.py`)
   - OpenAI-compatible API endpoints
   - Transforms requests to 1minAI format
   - Handles model mapping and error handling
   - Runs on `http://localhost:8000`

2. **LiteLLM Client** (`src/lib/litellm-client.ts`)
   - TypeScript client library
   - Provides clean interface for agents
   - Handles errors and retries
   - Logs all operations

3. **Agent Integration** (`src/lib/agents.ts`)
   - Modified to use LiteLLM as primary
   - Falls back to Google Gemini if LiteLLM fails
   - Maintains existing interface

4. **Vector Store** (`src/lib/vectorstore.ts`)
   - **UNCHANGED** - Still uses Google Gemini embeddings
   - **UNCHANGED** - Still uses same Qdrant database
   - Embeddings remain at 3072 dimensions

## Supported Models

The integration supports the following models through 1minAI:

### Gemini Models (Recommended)
- `gemini-2.0-flash-lite` ⭐ **DEFAULT - Fast and efficient**
- `gemini-2.0-flash` - More capable version
- `gemini-1.5-flash` - Previous generation
- `gemini-1.5-pro` - Most capable

### OpenAI Models
- `gpt-4o-mini` - Fast and cost-effective
- `gpt-4o` - Most capable GPT-4

### Anthropic Models
- `claude-3-5-sonnet` - Balanced performance
- `claude-3-haiku` - Fast responses

## Setup Instructions

### 1. Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- 1minAI API key (get from https://1min.ai)
- Existing Qdrant Cloud setup (no changes needed)

### 2. Environment Configuration

Edit `.env.local` with your API keys:

```bash
# LiteLLM / 1minAI Configuration (Primary)
NEXT_PUBLIC_USE_LITELLM=true
NEXT_PUBLIC_LITELLM_API_URL=http://localhost:8000
NEXT_PUBLIC_LITELLM_MODEL=gemini-2.0-flash-lite
NEXT_PUBLIC_LITELLM_TEMPERATURE=0.7
NEXT_PUBLIC_LITELLM_MAX_TOKENS=2048
ONEMINAI_API_KEY=your_1minai_api_key_here

# Google Gemini Configuration (Fallback/Embeddings only)
NEXT_PUBLIC_GOOGLE_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_EMBEDDING_MODEL=gemini-embedding-001
NEXT_PUBLIC_EMBEDDING_DIM=3072

# Qdrant Configuration (Unchanged)
NEXT_PUBLIC_QDRANT_CLOUD_URL=https://your-cluster-url.cloud.qdrant.io:6333
NEXT_PUBLIC_QDRANT_CLOUD_API_KEY=your_qdrant_api_key
NEXT_PUBLIC_COLLECTION_NAME=your_collection_name
```

### 3. Start Services

#### Option A: Using PowerShell Scripts (Recommended)

```powershell
# Start all services
.\start-services.ps1

# In another terminal, start Next.js
npm run dev

# View logs
.\logs.ps1

# Stop services
.\stop-services.ps1
```

#### Option B: Manual Start

```bash
# Start LiteLLM proxy
docker-compose up -d fastapi-litellm

# Check health
curl http://localhost:8000/health

# Start Next.js
npm run dev
```

### 4. Verify Integration

1. **Check LiteLLM Proxy**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy",...}
   ```

2. **List Available Models**
   ```bash
   curl http://localhost:8000/v1/models
   ```

3. **Test Chat Completion**
   ```bash
   curl -X POST http://localhost:8000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{
       "model": "gemini-2.0-flash-lite",
       "messages": [{"role": "user", "content": "Hello!"}]
     }'
   ```

4. **Test via Next.js App**
   - Navigate to `http://localhost:3000`
   - Ask a question in the chat
   - Check browser console for LiteLLM logs

## How It Works

### Request Flow

1. **User Query** → RAG Superbot frontend
2. **Agent Processing** → Agents (QueryAgent, AnswerAgent, RefineAgent)
3. **LLM Call** → `generateTextCompletion()` from litellm-client
4. **HTTP Request** → FastAPI proxy at localhost:8000
5. **Transform** → FastAPI converts to 1minAI format
6. **API Call** → 1minAI service (api.1min.ai)
7. **Response** → Transform back to OpenAI format
8. **Return** → Agent receives response
9. **RAG Pipeline** → Continue with retrieved documents
10. **Final Answer** → Display to user

### Fallback Strategy

```typescript
try {
  // Try LiteLLM proxy (1minAI)
  return await generateTextCompletion(prompt, {...});
} catch (error) {
  try {
    // Fallback to Google Gemini
    return await geminiAPI.generate(prompt);
  } catch (error) {
    try {
      // Fallback to Ollama (local only)
      return await ollamaAPI.generate(prompt);
    } catch (error) {
      // Return error message
      return "Unable to generate response";
    }
  }
}
```

## Embedding Strategy

**IMPORTANT:** Embeddings still use Google Gemini directly!

- Vector embeddings: Google Gemini `embedding-001` (3072 dims)
- RAG retrieval: Same Qdrant database
- Text generation: LiteLLM proxy (1minAI)

This hybrid approach ensures:
- Fast, free text generation via 1minAI
- Consistent embeddings for RAG retrieval
- No changes to existing Qdrant collections

## Configuration Options

### Switching Between Models

Edit `.env.local`:

```bash
# Use Gemini 2.0 Flash Lite (fastest, recommended)
NEXT_PUBLIC_LITELLM_MODEL=gemini-2.0-flash-lite

# Use GPT-4o-mini (OpenAI via 1minAI)
NEXT_PUBLIC_LITELLM_MODEL=gpt-4o-mini

# Use Claude Sonnet (Anthropic via 1minAI)
NEXT_PUBLIC_LITELLM_MODEL=claude-3-5-sonnet
```

### Disabling LiteLLM (Use Gemini Directly)

```bash
NEXT_PUBLIC_USE_LITELLM=false
```

### Adjusting Temperature

```bash
# More creative (0.8-1.0)
NEXT_PUBLIC_LITELLM_TEMPERATURE=0.9

# More deterministic (0.0-0.3)
NEXT_PUBLIC_LITELLM_TEMPERATURE=0.2
```

### Increasing Max Tokens

```bash
# Longer responses
NEXT_PUBLIC_LITELLM_MAX_TOKENS=4096
```

## Troubleshooting

### LiteLLM Proxy Not Starting

```bash
# Check Docker status
docker ps

# View logs
docker-compose logs fastapi-litellm

# Rebuild container
docker-compose build fastapi-litellm
docker-compose up -d fastapi-litellm
```

### Connection Refused Error

**Problem:** `LiteLLM proxy server is not running`

**Solution:**
```bash
# Ensure Docker service is running
.\start-services.ps1

# Check health endpoint
curl http://localhost:8000/health
```

### 1minAI API Errors

**Problem:** `1minAI API is currently unavailable`

**Solutions:**
1. Check your ONEMINAI_API_KEY in `.env.local`
2. Verify API key at https://1min.ai
3. Check 1minAI service status
4. Review logs: `.\logs.ps1`

### Fallback to Gemini

**Problem:** Always falling back to Gemini

**Check:**
1. Is `NEXT_PUBLIC_USE_LITELLM=true`?
2. Is LiteLLM proxy running? `curl http://localhost:8000/health`
3. Is ONEMINAI_API_KEY set correctly?
4. Check browser console for error messages

## Performance Comparison

| Metric | Google Gemini Direct | LiteLLM + 1minAI | Improvement |
|--------|---------------------|------------------|-------------|
| Cost | Paid API | **Free** | ✅ 100% savings |
| Latency | ~1-2s | ~1-3s | Similar |
| Rate Limits | High | Moderate | OK for dev |
| Models | Gemini only | Multiple providers | ✅ More choice |
| Setup | Simple | Docker required | One-time setup |

## Best Practices

1. **Development**: Use LiteLLM + 1minAI (free, fast)
2. **Production**: Consider paid APIs for higher rate limits
3. **Embeddings**: Always use Google Gemini (consistent vectors)
4. **Monitoring**: Check logs regularly (`.\logs.ps1`)
5. **Fallback**: Keep Google Gemini key as backup
6. **Testing**: Test with different models to find best fit

## API Endpoints

### LiteLLM Proxy Endpoints

- `GET /` - Service information
- `GET /health` - Health check
- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Chat completion
- `POST /chat/completions` - Chat completion (alias)

### Example Request

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.0-flash-lite",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is RAG?"}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

### Example Response

```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gemini-2.0-flash-lite",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "RAG stands for Retrieval-Augmented Generation..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

## Docker Configuration

### docker-compose.yml Overview

```yaml
services:
  fastapi-litellm:
    build:
      context: .
      dockerfile: Dockerfile.fastapi
    ports:
      - "8000:8000"
    environment:
      - ONEMINAI_API_KEY=${ONEMINAI_API_KEY}
      - DEFAULT_MODEL=gemini-2.0-flash-lite
    restart: unless-stopped
```

### Dockerfile Overview

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY fastapi_server.py .
CMD ["python", "fastapi_server.py"]
```

## Next Steps

1. **Get 1minAI API Key**: Sign up at https://1min.ai
2. **Update Environment**: Add your ONEMINAI_API_KEY to `.env.local`
3. **Start Services**: Run `.\start-services.ps1`
4. **Test Integration**: Open http://localhost:3000 and chat
5. **Monitor Logs**: Use `.\logs.ps1` to watch requests
6. **Optimize**: Adjust temperature and tokens for your use case

## Support

- **LiteLLM Docs**: https://docs.litellm.ai
- **1minAI**: https://1min.ai
- **FastAPI**: https://fastapi.tiangolo.com
- **Qdrant**: https://qdrant.tech/documentation

## Summary

✅ **What Changed:**
- Added FastAPI/LiteLLM proxy server
- Modified agents to use LiteLLM as primary
- Added fallback to Google Gemini
- Created deployment scripts
- Updated environment configuration

✅ **What Stayed the Same:**
- Qdrant vector database (no changes)
- Google Gemini embeddings (no changes)
- RAG pipeline logic (no changes)
- Frontend UI (no changes)
- Collection data (no migration needed)

✅ **Benefits:**
- Free API usage via 1minAI
- Multiple model providers
- Easy model switching
- Maintained compatibility
- Graceful fallbacks

🚀 **You're ready to use RAG Superbot with LiteLLM and 1minAI!**
