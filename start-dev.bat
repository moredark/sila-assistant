@echo off
REM Quick start script for local development on Windows
REM This script sets up and starts the bot in development mode

echo 🚀 Starting SILA Telegram Bot in Local Development Mode
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from .env.local template...
    copy .env.local .env >nul
    echo ⚠️  Please edit .env file with your configuration:
    echo    - TELEGRAM_BOT_TOKEN: Get from @BotFather on Telegram
    echo    - API_KEY: Get from Cloud.ru Foundation Models
    echo    - OBSIDIAN_VAULT_PATH: Path to your local Obsidian vault
    echo.
    echo Once configured, run this script again.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist data mkdir data
if not exist logs mkdir logs

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if build exists
if not exist dist (
    echo 🔨 Building the project...
    npm run build
    if %errorlevel% neq 0 (
        echo ❌ Build failed
        pause
        exit /b 1
    )
)

echo ✅ Starting development server...
echo The bot will run on http://localhost:3000
echo Press Ctrl+C to stop the bot
echo.

REM Start in development mode
npm run dev