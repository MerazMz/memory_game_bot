from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import time

app = Flask(__name__)
CORS(app)  # Allow all origins in production

# Load API key from environment variable
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found")
    api_key = os.environ.get("GOOGLE_API_KEY", "dummy_key")  # Fallback to alternative key

# Configure Gemini API
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')  # Use gemini-pro instead of gemini-2.0-flash

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
        - Word length: 4-6-8-10 letters
        - Must be not common and easily recognizable
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

@app.route('/api/health-check', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == "__main__":
    app.run(debug=True, port=5000)