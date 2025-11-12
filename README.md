# 🚀 SILA Telegram Bot

Telegram bot that converts voice messages to text tasks in private channels.

## What it does

- **Voice Transcription**: Converts voice messages to text using OpenAI Whisper API
- **AI Analysis**: Analyzes content and classifies as tasks, notes, or ideas
- **Smart Tasks**: Formats content into markdown tasks for better organization
- **Private Channels**: Posts formatted content to your private Telegram channels
- **SQLite Storage**: Stores user configurations and channel settings

## Technologies Used

- **Node.js 18+** - Runtime environment
- **TypeScript** - Type-safe development
- **grammy** - Telegram Bot API library
- **SQLite** - Local database for user configs
- **Fastify** - HTTP server for API endpoints
- **Cloud.ru API** - Whisper transcription & GigaChat AI
- **Docker** - Container deployment
- **PM2** - Process management for production

## Quick Start

1. **Setup:**

```bash
cp .env.local .env
```

2. **Edit .env:**

```env
TELEGRAM_BOT_TOKEN=your_bot_token
API_KEY=your_cloud_ru_api_key
```

3. **Run:**

```bash
npm install
npm run dev
```

## Commands

- `/start` - Start bot
- `/setchannel <id>` - Set private channel
- `/removechannel` - Remove channel
- `/debug` - Debug info
- `/help` - Help

## Deployment

**Docker:**

```bash
docker-compose up -d
```

**PM2:**

```bash
pm2 start ecosystem.config.js
```

## Setup Files

- `start-dev.bat` - Windows quick start
- `start-dev.sh` - Linux/Mac quick start
- `docker-compose.yml` - Docker config
- `ecosystem.config.js` - PM2 config
