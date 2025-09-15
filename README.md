# Social Media Chatbot Application

A comprehensive cross-platform chatbot application that assists users with WhatsApp, Instagram, and Snapchat on both Android and iOS devices.

## Features

- 🤖 **AI-Powered Chatbot**: Intelligent responses using natural language processing
- 📱 **Cross-Platform**: Works on both Android and iOS
- 🔗 **Multi-Platform Integration**: Supports WhatsApp, Instagram, and Snapchat
- 🔐 **Secure Authentication**: JWT-based user authentication
- 📊 **Analytics Dashboard**: Track chatbot performance and interactions
- 🎨 **Modern UI**: Beautiful and intuitive user interface
- 🔄 **Real-time Updates**: Live chat and notification system

## Architecture

- **Frontend**: React Native (Cross-platform mobile app)
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Real-time**: Socket.io
- **Authentication**: JWT
- **APIs**: WhatsApp Business API, Instagram Graph API, Snapchat Kit API

## Prerequisites

- Node.js (v16 or higher)
- React Native development environment
- MongoDB
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd ChatBot
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/social-chatbot

# JWT
JWT_SECRET=your-super-secret-jwt-key

# API Keys
WHATSAPP_API_TOKEN=your-whatsapp-business-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

SNAPCHAT_CLIENT_ID=your-snapchat-client-id
SNAPCHAT_CLIENT_SECRET=your-snapchat-client-secret

# Server
PORT=3000
NODE_ENV=development
```

### 4. Start the backend server
```bash
npm run dev
```

### 5. Start the mobile app
```bash
# Start Metro bundler
npm run mobile:start

# Run on Android (in another terminal)
npm run mobile:android

# Run on iOS (in another terminal, macOS only)
npm run mobile:ios
```

## API Integration Setup

### WhatsApp Business API
1. Create a Facebook Developer account
2. Set up a WhatsApp Business account
3. Apply for WhatsApp Business API access
4. Get your API token and phone number ID

### Instagram Graph API
1. Create a Facebook App
2. Add Instagram Basic Display product
3. Configure Instagram app settings
4. Get your App ID and App Secret

### Snapchat Kit API
1. Apply for Snapchat Kit API access
2. Create a Snapchat app
3. Get your Client ID and Client Secret

## Project Structure

```
ChatBot/
├── server/                 # Backend server
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── mobile/               # React Native app
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── screens/      # App screens
│   │   ├── navigation/   # Navigation setup
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── store/        # State management
│   └── android/          # Android-specific files
├── docs/                 # Documentation
└── README.md
```

## Usage

1. **Register/Login**: Create an account or sign in
2. **Connect Accounts**: Link your WhatsApp, Instagram, and Snapchat accounts
3. **Configure Chatbot**: Set up your chatbot's personality and responses
4. **Monitor Activity**: Track conversations and analytics
5. **Customize**: Adjust settings and responses as needed

## Security

- All API keys are stored securely using environment variables
- User authentication with JWT tokens
- Rate limiting to prevent abuse
- Input validation and sanitization
- HTTPS encryption for all communications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email your-email@example.com or create an issue in the repository.

## Roadmap

- [ ] Advanced NLP capabilities
- [ ] Multi-language support
- [ ] Voice message processing
- [ ] Image and video analysis
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
