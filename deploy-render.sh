#!/bin/bash

# Render Deployment Script for Psychiatry Therapy SuperBot
# This script helps you deploy to Render using their Blueprint feature

echo "🚀 Deploying Psychiatry Therapy SuperBot to Render..."

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found! Make sure you're in the project root directory."
    exit 1
fi

# Check if requirements-render.txt exists
if [ ! -f "requirements-render.txt" ]; then
    echo "❌ requirements-render.txt not found! This is required for Render deployment."
    exit 1
fi

echo "✅ Configuration files found"

# Display deployment information
echo ""
echo "📋 Deployment Configuration:"
echo "   Service Name: psychiatry-therapy-superbot-api"
echo "   Runtime: Python 3"
echo "   Plan: Free Tier"
echo "   Port: 10000 (automatic)"
echo "   Health Check: /health"
echo ""

# Instructions for manual deployment
echo "🔧 Manual Deployment Steps:"
echo ""
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Blueprint'"
echo "3. Connect your GitHub repository"
echo "4. Render will automatically detect render.yaml"
echo "5. Set the secret environment variable:"
echo "   - Key: ONEMINAI_API_KEY"
echo "   - Value: your_1minai_api_key_here"
echo "6. Click 'Apply'"
echo ""

# Display post-deployment steps
echo "📝 After Deployment:"
echo ""
echo "1. Your API will be available at:"
echo "   https://psychiatry-therapy-superbot-api.onrender.com"
echo ""
echo "2. Test the deployment:"
echo "   curl https://psychiatry-therapy-superbot-api.onrender.com/health"
echo ""
echo "3. Update your frontend configuration:"
echo "   NEXT_PUBLIC_LITELLM_API_URL=https://psychiatry-therapy-superbot-api.onrender.com"
echo ""

# Check if git is initialized and has commits
if [ -d ".git" ]; then
    echo "✅ Git repository detected"
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  You have uncommitted changes. Consider committing them before deployment:"
        echo "   git add ."
        echo "   git commit -m 'Update configuration for Render deployment'"
        echo "   git push origin main"
    else
        echo "✅ No uncommitted changes"
    fi
else
    echo "⚠️  No git repository found. Make sure your code is pushed to GitHub."
fi

echo ""
echo "🎉 Ready for Render deployment!"
echo "   Visit: https://dashboard.render.com to deploy"