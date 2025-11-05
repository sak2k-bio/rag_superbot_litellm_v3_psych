#!/bin/bash

# Deployment script for Psychiatry Therapy SuperBot Docker Compose to Render

echo "🎨 Deploying Psychiatry Therapy SuperBot Docker Compose to Render..."

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Installing..."
    
    # Install Render CLI based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install render
        else
            echo "Please install Homebrew first, then run: brew install render"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://cli.render.com/install | sh
    else
        echo "Please install Render CLI manually from: https://render.com/docs/cli"
        exit 1
    fi
fi

# Check if logged in to Render
echo "🔐 Checking Render authentication..."
if ! render auth whoami &> /dev/null; then
    echo "❌ Not logged in to Render. Please run: render auth login"
    exit 1
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found! Please make sure you're in the project root directory."
    exit 1
fi

echo "📋 Render will deploy your Docker Compose equivalent using render.yaml"
echo "🐳 This includes:"
echo "  ✅ Same Dockerfile (Dockerfile.fastapi)"
echo "  ✅ Same environment variables from docker-compose.yml"
echo "  ✅ Same FastAPI server configuration"
echo "  ✅ Same health checks"
echo "  ✅ Plus Render's cloud benefits (auto-scaling, SSL, monitoring)"
echo ""

# Ask if user wants to set the secret API key
read -p "Do you want to set your 1minAI API key as a secret? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your 1minAI API key: " ONEMINAI_KEY
    if [ ! -z "$ONEMINAI_KEY" ]; then
        echo "🔑 Setting ONEMINAI_API_KEY as a secret..."
        # Note: This will be set via Render dashboard after deployment
        echo "📝 Remember to set ONEMINAI_API_KEY in your Render service dashboard"
        echo "   Value: $ONEMINAI_KEY"
    fi
fi

# Deploy using render.yaml blueprint
echo ""
echo "🚀 Deploying to Render using Blueprint (render.yaml)..."
echo "📦 Render will:"
echo "  1. Read render.yaml configuration"
echo "  2. Build Docker image using Dockerfile.fastapi"
echo "  3. Set up environment variables (same as docker-compose)"
echo "  4. Deploy with auto-scaling and monitoring"
echo ""

# Check if this is a git repository
if [ ! -d ".git" ]; then
    echo "⚠️  This is not a git repository. Render requires git for deployment."
    echo "🔧 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Render deployment"
fi

# Deploy via Blueprint
render blueprint launch

if [ $? -eq 0 ]; then
    echo "✅ Render deployment initiated successfully!"
    echo ""
    echo "🌐 Your service will be available at:"
    echo "   https://psychiatry-therapy-superbot-api.onrender.com"
    echo "   (or your custom domain if configured)"
    echo ""
    echo "🧪 Test your deployment:"
    echo "  Health check: curl https://psychiatry-therapy-superbot-api.onrender.com/health"
    echo "  Models: curl https://psychiatry-therapy-superbot-api.onrender.com/v1/models"
    echo ""
    echo "🎉 Docker Compose deployment to Render complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set ONEMINAI_API_KEY in Render dashboard (if not done already)"
    echo "2. Test your API endpoints"
    echo "3. Update your Vercel environment variables with the Render URL"
    echo "4. Deploy your frontend to Vercel"
    echo ""
    echo "📊 Monitor your deployment:"
    echo "  View logs: render logs -s psychiatry-therapy-superbot-api"
    echo "  Check status: render services list"
    echo "  Open dashboard: https://dashboard.render.com"
    echo ""
    echo "🔧 Update your frontend .env with:"
    echo "  NEXT_PUBLIC_LITELLM_API_URL=https://psychiatry-therapy-superbot-api.onrender.com"
else
    echo "❌ Render deployment failed!"
    echo "🔍 Check the Render dashboard for deployment logs"
    echo "💡 Common issues:"
    echo "  - Make sure you're logged in: render auth login"
    echo "  - Check render.yaml syntax"
    echo "  - Ensure git repository is properly set up"
    exit 1
fi