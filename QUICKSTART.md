# Quick Start - RAG Superbot with LiteLLM

Get up and running in 5 minutes!

## Prerequisites

✅ Docker Desktop installed
✅ Node.js 18+ installed  
✅ 1minAI API key ([Get one here](https://1min.ai))

## Step 1: Get Your API Keys

1. **1minAI API Key**: https://1min.ai
2. **Google API Key** (for embeddings): https://makersuite.google.com/app/apikey
3. **Qdrant Cloud**: Already configured ✅

## Step 2: Configure Environment

```bash
# Copy template
cp config.env .env.local

# Edit .env.local with your API keys
notepad .env.local  # or use your favorite editor
```

**Update these values:**
```bash
ONEMINAI_API_KEY=your_1minai_key_here
NEXT_PUBLIC_GOOGLE_API_KEY=your_gemini_key_here
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start Services

```powershell
# Start LiteLLM proxy
.\start-services.ps1

# In another terminal, start Next.js
npm run dev
```

## Step 5: Test It!

Open http://localhost:3000 and start chatting!

## Verify Everything Works

### Check LiteLLM Proxy
```bash
curl http://localhost:8000/health
```

### Check Models
```bash
curl http://localhost:8000/v1/models
```

### Test Chat
Ask a question in the web interface at http://localhost:3000

## View Logs

```powershell
.\logs.ps1
```

## Stop Services

```powershell
.\stop-services.ps1
```

## Troubleshooting

**Problem:** Docker not starting
- **Solution:** Ensure Docker Desktop is running

**Problem:** Port 8000 already in use
- **Solution:** Stop other services using port 8000

**Problem:** 1minAI API errors
- **Solution:** Check your ONEMINAI_API_KEY in .env.local

## Next Steps

- Read [LITELLM_INTEGRATION.md](./LITELLM_INTEGRATION.md) for detailed documentation
- Try different models by changing `NEXT_PUBLIC_LITELLM_MODEL`
- Adjust temperature and max tokens for better responses

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Start services | `.\start-services.ps1` |
| Start Next.js | `npm run dev` |
| View logs | `.\logs.ps1` |
| Stop services | `.\stop-services.ps1` |
| Health check | `curl http://localhost:8000/health` |
| List models | `curl http://localhost:8000/v1/models` |

🚀 **Happy chatting with your RAG Superbot!**
