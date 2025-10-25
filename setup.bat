@echo off
REM Telegram Bot for Voice Notes in Obsidian - Setup Script for Windows
REM This script helps you set up the project quickly

echo 🚀 Setting up Telegram Bot for Voice Notes in Obsidian...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Create logs directory
echo 📁 Creating logs directory...
if not exist logs mkdir logs

REM Copy environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env >nul
    echo ⚠️  Please edit .env file with your configuration:
    echo    - TELEGRAM_BOT_TOKEN: Get from @BotFather on Telegram
    echo    - API_KEY: Get from Cloud.ru Foundation Models
    echo    - OBSIDIAN_VAULT_PATH: Path to your Obsidian vault
    echo    - GIT_REPO_URL: Your Obsidian vault Git repository URL
) else (
    echo ✅ .env file already exists
)

REM Build the project
echo 🔨 Building the project...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build successful

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Run 'npm run dev' to start in development mode
echo 3. Or run 'npm start' to start in production mode
echo.
echo For more information, see README.md
pause