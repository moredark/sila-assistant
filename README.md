# 🤖 Sila TG - Telegram Bot for Voice Notes

A sophisticated Telegram bot that transcribes voice messages, analyzes their content using AI, and organizes them into structured daily posts in a private Telegram channel. The bot automatically categorizes content into tasks, notes, and ideas, making it easy to manage daily thoughts and action items.

## ✨ Features

- 🎤 **Voice Message Processing**: Transcribe voice messages using Cloud.ru's Whisper API
- 🧠 **AI-Powered Analysis**: Uses LangChain and GPT to analyze and categorize content
- 📝 **Smart Content Organization**: Automatically formats tasks, notes, and ideas in Markdown
- 📅 **Daily Posts**: Creates and manages daily posts with random emojis and day of week
- 🏷️ **Content Categorization**: Automatically separates content into tasks, notes, and ideas
- 🎯 **Priority Detection**: Identifies task priorities and confidence levels
- 🔄 **Real-time Updates**: Updates daily posts in real-time as new content arrives
- 🗑️ **Daily Management**: Clear today's post with /clear command

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Telegram   │    │   grammY    │    │  Fastify    │    │  Cloud.ru   │
│    Bot      │───▶│   Bot       │──▶│   Server    │──▶│   Whisper   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                 │
                                                                 ▼
                    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                    │  Telegram   │    │   Channel   │    │  LangChain  │
                    │  Channel    │◀──│   Service   │◀──│   + LLM      │
                    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Telegram Bot Token
- Cloud.ru API key
- Private Telegram Channel

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sila-tg
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   PRIVATE_CHANNEL_ID=your_private_channel_id_here
   ALLOWED_USERNAME=your_telegram_username

   # Cloud.ru API Configuration
   API_KEY=your_cloud_ru_api_key_here

   # Server Configuration
   PORT=3000
   HOST=localhost

   # Logging Configuration
   LOG_LEVEL=info
   ```

4. **Set up your Telegram channel**

   - Create a private Telegram channel
   - Add your bot as an administrator to the channel
   - Get the channel ID and add it to your `.env` file

5. **Build and run**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## 📖 Usage

### Basic Commands

- `/start` - Start the bot and see welcome message
- `/help` - Show help information
- `/status` - Check bot status
- `/clear` - Clear today's post

### Adding Content

1. **Send a voice message** to the bot
2. **Wait for processing** - The bot will:
   - 🎤 Download and transcribe your voice
   - 🧠 Analyze the content with AI
   - 📝 Categorize it as task/note/idea
   - 📅 Add it to today's post in your channel
3. **Receive confirmation** with details about what was added

## 🔧 Configuration

### Environment Variables

| Variable             | Description                                | Required |
| -------------------- | ------------------------------------------ | -------- |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather         | ✅       |
| `PRIVATE_CHANNEL_ID` | Private Telegram channel ID                | ✅       |
| `ALLOWED_USERNAME`   | Allowed Telegram username for access       | ✅       |
| `API_KEY`            | Cloud.ru API key for Whisper transcription | ✅       |
| `PORT`               | Server port (default: 3000)                | ❌       |
| `HOST`               | Server host (default: localhost)           | ❌       |
| `LOG_LEVEL`          | Logging level (default: info)              | ❌       |

### Creating a Telegram Bot

1. Start a chat with [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the bot token and add it to your `.env` file

### Setting up Private Channel

1. Create a private Telegram channel
2. Add your bot as an administrator
3. Send a message to the channel to get the channel ID
4. Add the channel ID to your `.env` file

### Getting Channel ID

1. Add your bot to the channel
2. Send a message to the channel
3. Check the bot logs or use a Telegram bot like @userinfobot to get the channel ID

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit them: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 Development

### Scripts

- `npm run dev` - Start in development mode with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start the production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Adding New Features

The bot is designed to be modular. To add new features:

1. **New commands**: Add handlers in `src/bot/handlers.ts`
2. **New services**: Create services in `src/services/`
3. **New API endpoints**: Add routes in `src/server/routes/`
4. **New constants**: Add to appropriate files in `src/constants/`

## 🐛 Troubleshooting

### Common Issues

1. **Bot doesn't respond to voice messages**

   - Check your Telegram bot token
   - Ensure the bot has permission to receive messages
   - Verify the allowed username is correct
   - Check the logs for errors

2. **Transcription fails**

   - Verify your Cloud.ru API key
   - Check if you have sufficient API credits
   - Ensure the audio format is supported

3. **Channel operations fail**

   - Check your channel ID
   - Ensure the bot is an administrator in the channel
   - Verify the bot has posting permissions

4. **AI analysis fails**

   - Check if you have sufficient API credits
   - Ensure the API key has the correct permissions

### Logs

Check the `logs/` directory for detailed error information:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [grammy](https://grammy.dev/) - Telegram bot framework
- [Fastify](https://www.fastify.io/) - Fast web framework
- [Cloud.ru](https://cloud.ru/) - Whisper API
- [LangChain](https://langchain.com/) - LLM framework
