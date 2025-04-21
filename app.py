from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import google.generativeai as genai
import os
import time
import logging
import json
import uuid
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='.')
app.secret_key = os.getenv("SECRET_KEY", "memory-game-secret-key")
CORS(app)

# Load API key from environment variable
api_key = os.getenv("GEMINI_API_KEY")
logger.info(f"API Key exists: {bool(api_key)}")

# Initialize model only if API key is available
model = None
if api_key:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        logger.info("Gemini model initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini model: {str(e)}")
else:
    logger.error("GEMINI_API_KEY not found in environment variables")

# Store conversation history
conversations = {}

def generate_with_retry(prompt, conversation_id=None, max_retries=3):
    if not model:
        logger.error("Model not initialized in generate_with_retry")
        return None, "Model not initialized"
    
    # Use conversation history if available
    conversation_history = []
    if conversation_id and conversation_id in conversations:
        conversation_history = conversations[conversation_id]["messages"][-5:]  # Use last 5 messages for context
        
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to generate content, attempt {attempt + 1}")
            
            # If we have conversation history, include it in the prompt
            if conversation_history:
                context = "\n".join([f"User: {msg['user']}\nChatbot: {msg['bot']}" for msg in conversation_history])
                full_prompt = f"""Previous conversation:\n{context}\n\nCurrent prompt: {prompt}"""
            else:
                full_prompt = prompt
                
            response = model.generate_content(full_prompt)
            if response and response.text:
                logger.info("Successfully generated content")
                return response, None
            else:
                logger.error("Empty response from model")
                return None, "Empty response from model"
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
            logger.error("Model not initialized in generate_word")
            return jsonify({'error': 'Model not initialized'}), 500
            
        word_prompt = """
        Generate a single random word:
        - Word length: 6-8-10 letters
        - Must be not common and not easily recognizable
        - Return ONLY the word in UPPERCASE, no other text or punctuation
        Example response format: APPLE
        """
        
        logger.info("Generating word...")
        response, error = generate_with_retry(word_prompt)
        if error:
            logger.error(f"Error generating word: {error}")
            return jsonify({'error': error}), 500
            
        if not response or not response.text:
            logger.error("No word generated")
            return jsonify({'error': 'No word generated'}), 500
            
        word = response.text.strip().split()[0].upper()
        logger.info(f"Generated word: {word}")
        
        if not word.isalpha() or len(word) < 4 or len(word) > 10:
            logger.error(f"Invalid word generated: {word}")
            return jsonify({'error': 'Invalid word generated'}), 500
            
        return jsonify({'word': word})
    except Exception as e:
        logger.error(f"Error in generate_word: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if not model:
            logger.error("Model not initialized in chat")
            return jsonify({'error': 'Model not initialized'}), 500
            
        data = request.get_json()
        logger.info(f"Received chat request: {json.dumps(data)}")
        
        message = data.get('message', '').strip()
        conversation_id = data.get('conversationId', str(uuid.uuid4()))
        
        if not message:
            logger.error("No message provided in chat request")
            return jsonify({'error': 'No message provided'}), 400
        
        # Initialize conversation if it doesn't exist
        if conversation_id not in conversations:
            conversations[conversation_id] = {
                "created_at": datetime.now().isoformat(),
                "messages": [],
                "current_story": None,
                "current_question": None,
                "story_answer": None,
                "waiting_for_answer": False,
                "score": 0
            }
        
        # Check if this is a new session or continuing
        is_new_session = len(conversations[conversation_id]["messages"]) == 0
        is_waiting_for_answer = conversations[conversation_id].get("waiting_for_answer", False)
        current_story = conversations[conversation_id].get("current_story")
        current_question = conversations[conversation_id].get("current_question")
        
        # Create a personality and story-focused prompt
        prompt = f"""
        You are a Memory Game Chatbot that specializes in telling short, tricky stories and asking questions about them. Your role is to:
        1. Tell short, engaging stories (2-3 sentences) that include specific details
        2. Ask a question about a detail from the story to test the user's memory
        3. Track scores and acknowledge correct answers
        4. Make the experience fun and educational
        5. Maintain context awareness of the ongoing conversation
        
        Current user message: {message}
        
        Conversation state information:
        - Is new conversation: {'yes' if is_new_session else 'no'}
        - Current score: {conversations[conversation_id].get("score", 0)}
        - Has active story question: {'yes' if is_waiting_for_answer else 'no'}
        
        Guidelines for your response:
        - If this is a new conversation or the user types 'start', introduce yourself and tell a short story
        - After telling a story, wait for the user to say they're ready before asking the question (don't show the story and question together)
        - When the user says they're ready, ask a specific question about a detail from the story
        - If there's an active question, evaluate their answer and provide feedback
        - If they ask for a hint, provide a subtle hint without giving away the answer
        - If they ask who developed you, tell them Meraz, Yash, and Rakhi
        - Keep your responses friendly, encouraging, and conversational
        - After they answer correctly, ask if they want another story
        - Include context from previous messages in the conversation

        Story types to use (choose randomly):
        - Short fictional scenarios with characters and actions
        - Tiny mysteries with subtle clues
        - Brief historical anecdotes
        - Small travel descriptions with details
        - Day-in-the-life scenarios with specific elements
        
        Response format:
        - If telling a story: "Here's a short story: [2-3 sentence story]. Let me know when you're ready for a question about it!"
        - If asking a question: "Here's your question: [specific question about story detail]"
        - If evaluating answer: "[Feedback on correctness]. [Acknowledge correct/explain correct answer]."
        
        Respond in a friendly, encouraging tone.
        """
        
        logger.info("Generating chat response...")
        response, error = generate_with_retry(prompt, conversation_id)
        if error:
            logger.error(f"Error generating chat response: {error}")
            return jsonify({'error': error}), 500
            
        if not response or not response.text:
            logger.error("No chat response generated")
            return jsonify({'error': 'No response generated'}), 500
        
        bot_response = response.text
        
        # Store the conversation
        conversations[conversation_id]["messages"].append({
            "user": message,
            "bot": bot_response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Track conversation state based on response patterns
        if "Here's a short story:" in bot_response:
            # Extract the story (everything between "Here's a short story:" and "Let me know when you're ready")
            story_start = bot_response.find("Here's a short story:") + len("Here's a short story:")
            story_end = bot_response.find("Let me know when you're ready")
            if story_end > story_start:
                story = bot_response[story_start:story_end].strip()
                conversations[conversation_id]["current_story"] = story
                conversations[conversation_id]["waiting_for_answer"] = False
                conversations[conversation_id]["current_question"] = None
        
        elif "Here's your question:" in bot_response or "question:" in bot_response.lower():
            # Extract the question
            question_start = bot_response.find("Here's your question:") 
            if question_start == -1:
                # Try alternate format
                question_start = bot_response.lower().find("question:")
                if question_start != -1:
                    question_start = bot_response.find(":", question_start) + 1
            else:
                question_start += len("Here's your question:")
                
            if question_start != -1:
                question = bot_response[question_start:].strip()
                conversations[conversation_id]["current_question"] = question
                conversations[conversation_id]["waiting_for_answer"] = True
        
        elif "correct" in bot_response.lower() and conversations[conversation_id].get("waiting_for_answer"):
            # If the response indicates a correct answer
            conversations[conversation_id]["score"] += 1
            conversations[conversation_id]["waiting_for_answer"] = False
            conversations[conversation_id]["current_story"] = None
            conversations[conversation_id]["current_question"] = None
        
        elif "incorrect" in bot_response.lower() or "wrong" in bot_response.lower():
            # If the response indicates an incorrect answer
            conversations[conversation_id]["waiting_for_answer"] = False
            
        elif "ready" in message.lower() and conversations[conversation_id].get("current_story") and not conversations[conversation_id].get("waiting_for_answer"):
            # User is ready for a question
            pass  # The next bot response will contain the question
        
        # Clean up old conversations (optional, for server memory management)
        if len(conversations) > 1000:
            # Remove oldest conversations
            sorted_convs = sorted(conversations.items(), key=lambda x: x[1]["created_at"])
            for i in range(len(sorted_convs) - 1000):
                del conversations[sorted_convs[i][0]]
            
        logger.info("Successfully generated chat response")
        return jsonify({
            'response': bot_response,
            'conversationId': conversation_id
        })
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health-check', methods=['GET'])
def health_check():
    status = {
        'status': 'ok',
        'api_configured': bool(api_key),
        'model_initialized': bool(model),
        'active_conversations': len(conversations)
    }
    logger.info(f"Health check status: {json.dumps(status)}")
    return jsonify(status)

# This is required for Vercel
app = app

if __name__ == "__main__":
    app.run(debug=True, port=5000)