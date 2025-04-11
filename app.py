from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import os
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='.')
CORS(app)

# Load API key from environment variable
api_key = os.getenv("GEMINI_API_KEY")

# Initialize model only if API key is available
model = None
if api_key:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        logger.info("Gemini model initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini model: {str(e)}")
else:
    logger.error("GEMINI_API_KEY not found in environment variables")

def generate_with_retry(prompt, max_retries=3):
    if not model:
        return None, "Model not initialized"
        
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            if response.text:
                return response, None
        except Exception as e:
            logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                return None, str(e)
            time.sleep(1)
    return None, "Max retries exceeded"

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/generate-word', methods=['POST'])
def generate_word():
    try:
        if not model:
            return jsonify({'error': 'Model not initialized'}), 500
            
        word_prompt = """
        Generate a single random word:
        - Word length: 6-8-10 letters
        - Must be not common and not easily recognizable
        - Return ONLY the word in UPPERCASE, no other text or punctuation
        Example response format: APPLE
        """
        
        response, error = generate_with_retry(word_prompt)
        if error:
            return jsonify({'error': error}), 500
            
        if not response or not response.text:
            return jsonify({'error': 'No word generated'}), 500
            
        word = response.text.strip().split()[0].upper()
        
        if not word.isalpha() or len(word) < 4 or len(word) > 10:
            return jsonify({'error': 'Invalid word generated'}), 500
            
        return jsonify({'word': word})
    except Exception as e:
        logger.error(f"Error generating word: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if not model:
            return jsonify({'error': 'Model not initialized'}), 500
            
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
            
        prompt = f"""
        You are a memory game chatbot Your role is to:
        1. Engage users in memory-based games through conversation
        2. Provide hints and feedback
        3. Track scores and progress
        4. Make the experience fun and educational
        5. Tell stories and ask questions related to story.
        
        Current user message: {message}
        
        Respond in a friendly, encouraging tone. If the user types 'start', begin a new memory game. And if user ask who is your developer, tell them Meraz, Yash, Rakhi.
        """
        
        response, error = generate_with_retry(prompt)
        if error:
            return jsonify({'error': error}), 500
            
        if not response or not response.text:
            return jsonify({'error': 'No response generated'}), 500
            
        return jsonify({'response': response.text})
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health-check', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'api_configured': bool(api_key),
        'model_initialized': bool(model)
    })

# This is required for Vercel
app = app

if __name__ == "__main__":
    app.run(debug=True, port=5000)