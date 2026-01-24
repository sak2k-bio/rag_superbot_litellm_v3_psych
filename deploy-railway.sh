#!/bin/bash

# Deployment script for Psychiatry Therapy SuperBot Docker Compose to Railway

echo "🚂 Deploying Psychiatry Therapy SuperBot Docker Compose to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in to Railway
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

# Check if project exists, if not create one
echo "📋 Setting up Railway project..."
if [ ! -f ".railway" ] && [ ! -d ".railway" ]; then
    echo "Creating new Railway project..."
    railway init --name "psychiatry-therapy-superbot"
else
    echo "✅ Railway project already configured"
fi

# Set environment variables from docker-compose
echo "🔑 Setting up environment variables from docker-compose..."
echo "This will set all the environment variables defined in your docker-compose.yml"
echo ""

# Ask if user wants to set variables via CLI
read -p "Do you want to set environment variables via CLI now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting environment variables from docker-compose configuration..."
    
    # Prompt for 1minAI API key (the only secret needed)
    read -p "Enter your 1minAI API key: " ONEMINAI_KEY
    if [ ! -z "$ONEMINAI_KEY" ]; then
        railway variables set ONEMINAI_API_KEY="$ONEMINAI_KEY"
    fi
    
    # Set all other variables from docker-compose.yml
    echo "Setting FastAPI configuration..."
    railway variables set FASTAPI_HOST=0.0.0.0
    railway variables set FASTAPI_PORT=8000
    railway variables set FASTAPI_RELOAD=false
    railway variables set FASTAPI_LOG_LEVEL=info
    
    echo "Setting LiteLLM configuration..."
    railway variables set LITELLM_BASE_URL=https://api.1min.ai
    railway variables set DEFAULT_MODEL=mistral-small-latest
    railway variables set MAX_TOKENS=4096
    railway variables set TEMPERATURE=0.7
    
    echo "Setting CORS configuration..."
    railway variables set CORS_ORIGINS="*"
    railway variables set CORS_ALLOW_CREDENTIALS=true
    
    echo "Setting health check configuration..."
    railway variables set HEALTH_CHECK_INTERVAL=30
    
    echo "✅ All environment variables set!"
else
    echo "⏭️  Skipping environment variable setup."
    echo "📝 Please set these variables in Railway dashboard:"
    echo "  ONEMINAI_API_KEY=your_1minai_api_key_here"
    echo "  FASTAPI_HOST=0.0.0.0"
    echo "  FASTAPI_PORT=8000"
    echo "  FASTAPI_RELOAD=false"
    echo "  FASTAPI_LOG_LEVEL=info"
    echo "  LITELLM_BASE_URL=https://api.1min.ai"
    echo "  DEFAULT_MODEL=mistral-small-latest"
    echo "  MAX_TOKENS=4096"
    echo "  TEMPERATURE=0.7"
    echo "  CORS_ORIGINS=*"
    echo "  CORS_ALLOW_CREDENTIALS=true"
    echo "  HEALTH_CHECK_INTERVAL=30"
fi

# Deploy to Railway using the Dockerfile (Railway will build the same image as docker-compose)
echo ""
echo "🚀 Deploying Docker container to Railway..."
echo "📦 Railway will build using Dockerfile.fastapi (same as docker-compose)"
railway up

if [ $? -eq 0 ]; then
    echo "✅ Railway deployment successful!"
    echo ""
    
    # Get the deployment URL
    echo "🔍 Getting deployment URL..."
    RAILWAY_URL=$(railway domain 2>/dev/null || echo "")
    
    if [ -z "$RAILWAY_URL" ]; then
        echo "🌐 Getting Railway service URL..."
        railway status
        echo ""
        echo "💡 Your service is deployed! Get the URL from 'railway status' or Railway dashboard"
    else
        echo "🌐 Your API is deployed at: https://$RAILWAY_URL"
        echo ""
        echo "🧪 Test your deployment:"
        echo "  Health check: curl https://$RAILWAY_URL/health"
        echo "  Models: curl https://$RAILWAY_URL/v1/models"
        echo ""
        echo "🔧 Update your frontend .env with:"
        echo "  NEXT_PUBLIC_LITELLM_API_URL=https://$RAILWAY_URL"
    fi
    
    echo ""
    echo "🎉 Docker Compose deployment to Railway complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test your API endpoints"
    echo "2. Update your Vercel environment variables with the Railway URL"
    echo "3. Deploy your frontend to Vercel"
    echo ""
    echo "📊 Monitor your deployment:"
    echo "  View logs: railway logs"
    echo "  Check status: railway status"
    echo "  Open dashboard: railway open"
else
    echo "❌ Railway deployment failed!"
    echo "🔍 Check logs with: railway logs"
    exit 1
fi