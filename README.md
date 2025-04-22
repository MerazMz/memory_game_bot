# Memory Game Bot

A Flask web application featuring a memory game chatbot and word wizard powered by Google's Gemini API.

## Deployment to Vercel

1. Fork or clone this repository
2. Connect the repository to Vercel
3. Configure the following environment variables in Vercel:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `SECRET_KEY`: A random string for Flask session security

## Local Development

1. Clone the repository
2. Create a `.env` file based on `.env.example` and add your API keys
3. Install dependencies: `pip install -r requirements.txt`
4. Run the application: `python app.py`
5. Open http://localhost:5000 in your browser

## Notes on Vercel Deployment

- Vercel runs serverless functions which reset between invocations
- Conversation history is maintained in memory and will be lost between deployments or when functions go idle
- For production, consider implementing a database solution for persistent storage

## Features

- Memory Game Chatbot: Tests memory with short stories and follow-up questions
- Word Wizard: Generates random words for games

## Project Structure

```
memory_game_bot_AI_Project/
├── .vscode/                 # VS Code configuration files
├── images/                  # Game assets and images
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── app.py                   # Backend server (Python)
├── index.html              # Main HTML file
├── script.js               # Frontend JavaScript logic
└── vercel.json             # Vercel deployment configuration
```

## Components

### Frontend
- `index.html`: Main game interface and structure
- `script.js`: Game logic, AI implementation, and user interactions
- `images/`: Game assets and card images

### Backend
- `app.py`: Server-side logic and API endpoints
- `.env`: Environment configuration and secrets

### Configuration
- `.vscode/`: Development environment settings
- `vercel.json`: Deployment configuration for Vercel
- `.gitignore`: Git version control settings

## Features
- Memory game with AI opponent
- Interactive user interface
- Score tracking
- Responsive design

## Setup
1. Clone the repository
2. Install dependencies
3. Configure environment variables in `.env`
4. Run the application using `python app.py` 