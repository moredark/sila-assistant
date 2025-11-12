#!/bin/bash

# Quick start script for local development
# This script sets up and starts the bot in development mode

echo "🚀 Starting SILA Telegram Bot in Local Development Mode"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.local template..."
    cp .env.local .env
    echo "⚠️  Please edit .env file with your configuration:"
    echo "   - TELEGRAM_BOT_TOKEN: Get from @BotFather on Telegram"
    echo "   - API_KEY: Get from Cloud.ru Foundation Models"
    echo "   - OBSIDIAN_VAULT_PATH: Path to your local Obsidian vault"
    echo ""
    echo "Once configured, run this script again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data logs

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if build exists
if [ ! -d "dist" ]; then
    echo "🔨 Building the project..."
    npm run build
fi

echo "✅ Starting development server..."
echo "The bot will run on http://localhost:3000"
echo "Press Ctrl+C to stop the bot"
echo ""

# Start in development mode
npm run dev