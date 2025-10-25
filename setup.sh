#!/bin/bash

# Telegram Bot for Voice Notes in Obsidian - Setup Script
# This script helps you set up the project quickly

echo "🚀 Setting up Telegram Bot for Voice Notes in Obsidian..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration:"
    echo "   - TELEGRAM_BOT_TOKEN: Get from @BotFather on Telegram"
    echo "   - API_KEY: Get from Cloud.ru Foundation Models"
    echo "   - OBSIDIAN_VAULT_PATH: Path to your Obsidian vault"
    echo "   - GIT_REPO_URL: Your Obsidian vault Git repository URL"
else
    echo "✅ .env file already exists"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'npm run dev' to start in development mode"
echo "3. Or run 'npm start' to start in production mode"
echo ""
echo "For more information, see README.md"