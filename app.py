from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import time

app = Flask(__name__)
CORS(app)

# Load API key from .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found. Please set it in a .env file.")
    exit(1)

# Configure Gemini API
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')  # Fixed model name to use gemini-pro

def generate_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            if response.text:  # Add response validation
                return response
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                raise e
            time.sleep(1)

@app.route('/api/generate-word', methods=['POST'])
def generate_word():
    try:
        word_prompt = """
        Generate a single random word:
        - Word length: 6-8-10 letters
        - Must be not common and not easily recognizable
        - Return ONLY the word in UPPERCASE, no other text or punctuation
        Example response format: APPLE
        """
        
        response = generate_with_retry(word_prompt)
        if not response or not response.text:
            return jsonify({'error': 'No word generated'}), 500
            
        word = response.text.strip().split()[0].upper()  # Get first word only
        
        # Validate word
        if not word.isalpha() or len(word) < 4 or len(word) > 10:  # Fixed length validation
            return jsonify({'error': 'Invalid word generated'}), 500
            
        return jsonify({'word': word})
    except Exception as e:
        print(f"Error generating word: {str(e)}")  # Add error logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
            
        # Create a prompt for the memory game chatbot
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
        
        response = generate_with_retry(prompt)
        if not response or not response.text:
            return jsonify({'error': 'No response generated'}), 500
            
        return jsonify({'response': response.text})
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health-check', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == "__main__":
    app.run(debug=True, port=5000)