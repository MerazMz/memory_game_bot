const config = {
    API_URL: process.env.NODE_ENV === 'production' 
        ? 'https://memory-game-bot.vercel.app/api'
        : 'http://localhost:5000/api'
};

export default config;