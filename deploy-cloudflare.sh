#!/bin/bash

# Deployment script for Psychiatry Therapy SuperBot to Cloudflare Workers

echo "🚀 Deploying Psychiatry Therapy SuperBot API to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

# Set secrets (you'll need to run these manually first time)
echo "🔑 Setting up secrets..."
echo "Please make sure you've set the following secrets:"
echo "  wrangler secret put ONEMINAI_API_KEY"
echo ""

# Deploy to staging first
echo "🧪 Deploying to staging environment..."
wrangler deploy --env staging

if [ $? -eq 0 ]; then
    echo "✅ Staging deployment successful!"
    echo "🌐 Staging URL: https://psychiatry-therapy-superbot-api-staging.YOUR_SUBDOMAIN.workers.dev"
    echo ""
    
    # Ask for production deployment
    read -p "Deploy to production? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying to production..."
        wrangler deploy --env production
        
        if [ $? -eq 0 ]; then
            echo "✅ Production deployment successful!"
            echo "🌐 Production URL: https://psychiatry-therapy-superbot-api.YOUR_SUBDOMAIN.workers.dev"
            echo ""
            echo "🎉 Deployment complete!"
            echo ""
            echo "📋 Next steps:"
            echo "1. Update your Vercel environment variables with the new API URL"
            echo "2. Test the API endpoints"
            echo "3. Deploy your frontend to Vercel"
        else
            echo "❌ Production deployment failed!"
            exit 1
        fi
    else
        echo "⏭️  Skipping production deployment"
    fi
else
    echo "❌ Staging deployment failed!"
    exit 1
fi