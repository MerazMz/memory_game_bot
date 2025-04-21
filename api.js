// api.js - Client-side implementation of API functionality

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyBX_AHyoRYHRB6MIvSo3u-5LpDRnL4v8kA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

// Helper function to make API calls to Gemini
async function callGeminiAPI(prompt, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GEMINI_API_KEY}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates[0]?.content?.parts[0]?.text || null;
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            if (attempt === maxRetries - 1) {
                throw error;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    throw new Error("Max retries exceeded");
}

// Client-side implementation of /api/generate-word
async function generateWord() {
    try {
        const wordPrompt = `
        Generate a single random word:
        - Word length: 6-8-10 letters
        - Must be not common and not easily recognizable
        - Return ONLY the word in UPPERCASE, no other text or punctuation
        Example response format: APPLE
        `;
        
        const response = await callGeminiAPI(wordPrompt);
        if (!response) {
            throw new Error('No word generated');
        }
        
        const word = response.trim().split(/\s+/)[0].toUpperCase();
        
        if (!word.match(/^[A-Z]+$/) || word.length < 4 || word.length > 10) {
            throw new Error('Invalid word generated');
        }
        
        return { word };
    } catch (error) {
        console.error('Error generating word:', error);
        return { error: error.message };
    }
}

// Client-side implementation of /api/chat
async function chatWithBot(message) {
    try {
        if (!message.trim()) {
            return { error: 'No message provided' };
        }
        
        const prompt = `
        You are a memory game chatbot Your role is to:
        1. Engage users in memory-based games through conversation
        2. Provide hints and feedback
        3. Track scores and progress
        4. Make the experience fun and educational
        5. Tell stories and ask questions related to story.
        
        Current user message: ${message}
        
        Respond in a friendly, encouraging tone. If the user types 'start', begin a new memory game. And if user ask who is your developer, tell them Meraz, Yash, Rakhi.
        `;
        
        const response = await callGeminiAPI(prompt);
        if (!response) {
            throw new Error('No response generated');
        }
        
        return { response };
    } catch (error) {
        console.error('Error in chat:', error);
        return { error: error.message };
    }
}

// Client-side implementation of /api/health-check
function healthCheck() {
    return {
        status: 'ok',
        api_configured: Boolean(GEMINI_API_KEY),
        client_side: true
    };
}

// Export the API functions
const API = {
    generateWord,
    chatWithBot,
    healthCheck
};

// Make API available globally
window.API = API;