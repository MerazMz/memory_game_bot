// Add these functions at the beginning of your script
        function showGame(gameId) {
            document.getElementById('gameSelection').classList.add('hidden');
            document.getElementById(gameId).classList.remove('hidden');
        }

        function showGameSelection() {
            // Hide all game sections
            document.getElementById('memoryGame').classList.add('hidden');
            document.getElementById('wordGame').classList.add('hidden');
            document.getElementById('numberGame').classList.add('hidden');
            document.getElementById('visualGame').classList.add('hidden');
            document.getElementById('reactionGame').classList.add('hidden');
            document.getElementById('chatbotGame').classList.add('hidden');
            document.getElementById('gameSelection').classList.remove('hidden');
            
            // Reset any running games
            if (timerInterval) {
                clearInterval(timerInterval);
                gameStarted = false;
            }
            
            // Reset word game
            resetGame();
            
            // Reset number game
            if (numberDisplayTimeout) {
                clearTimeout(numberDisplayTimeout);
            }
            numberScore = 0;
            numberGameStarted = false;
            document.getElementById('numberScore').textContent = '0';
            resetNumberGame();
        }

        // Your existing game code starts here
        const cards = [
            '🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢',
            '🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢'
        ];

        let flippedCards = [];
        let matchedPairs = 0;
        let isProcessing = false;
        let gameStarted = false;
        let timerInterval;
        let seconds = 0;

        function shuffleCards(array) {
            return array.sort(() => Math.random() - 0.5);
        }

        function createCard(emoji, index) {
            const card = document.createElement('div');
            card.className = 'aspect-square bg-white/10 backdrop-blur-lg rounded-xl cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25 relative [perspective:1000px]';
            card.innerHTML = `
                <div class="card-inner w-full h-full transition-transform duration-500 transform-style-preserve-3d relative">
                    <div class="card-front absolute w-full h-full backface-hidden bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center">
                        
                    </div>
                    <div class="card-back absolute w-full h-full backface-hidden [transform:rotateY(180deg)] bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center">
                        <span class="text-4xl">${emoji}</span>
                    </div>
                </div>
            `;
            card.setAttribute('data-index', index);
            card.addEventListener('click', () => flipCard(card, emoji));
            return card;
        }

        function flipCard(card, emoji) {
            if (isProcessing || !gameStarted || flippedCards.includes(card)) return;
        
            const cardInner = card.querySelector('.card-inner');
            cardInner.style.transform = 'rotateY(180deg)';
            flippedCards.push(card);
        
            if (flippedCards.length === 2) {
                isProcessing = true;
                checkMatch();
            }
        }

        function checkMatch() {
            const [card1, card2] = flippedCards;
            const match = card1.querySelector('.card-back').innerHTML === card2.querySelector('.card-back').innerHTML;
        
            setTimeout(() => {
                if (match) {
                    matchedPairs++;
                    card1.classList.add('opacity-50');
                    card2.classList.add('opacity-50');
                    updateScore();
                    if (matchedPairs === 8) endGame();
                } else {
                    card1.querySelector('.card-inner').style.transform = 'rotateY(0deg)';
                    card2.querySelector('.card-inner').style.transform = 'rotateY(0deg)';
                }
                flippedCards = [];
                isProcessing = false;
            }, 1000);
        }

        function updateScore() {
            document.getElementById('score').textContent = matchedPairs;
        }

        // Add this variable with other game variables
        const TIME_LIMIT = 60; // 1 minute in seconds
        
        function updateTimer() {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const timeLeft = TIME_LIMIT - seconds;
        
            if (timeLeft <= 0) {
                // Time's up
                gameOver();
                return;
            }
        
            document.getElementById('timer').textContent = 
                `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;
        }
        
        function gameOver() {
            gameStarted = false;
            clearInterval(timerInterval);
        
            // Show game over modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md w-full">
                    <h2 class="text-2xl font-bold text-white mb-4">Time's Up! ⏰</h2>
                    <p class="text-gray-300 mb-4">You matched ${matchedPairs} pairs.</p>
                    <button onclick="this.parentElement.parentElement.remove(); startGame();" 
                            class="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-6 py-2 rounded-full">
                        Try Again
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Update startGame function
        function startGame() {
            const gameGrid = document.getElementById('gameGrid');
            gameGrid.innerHTML = '';
            matchedPairs = 0;
            seconds = 0;
            gameStarted = true;
            updateScore();
        
            const shuffledCards = shuffleCards([...cards]);
            shuffledCards.forEach((emoji, index) => {
                gameGrid.appendChild(createCard(emoji, index));
            });
        
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(updateTimer, 1000);
            // Initialize timer display
            document.getElementById('timer').textContent = '01:00';
        }

        // Add these constants at the top of your script
        const GEMINI_API_KEY = 'AIzaSyBX_AHyoRYHRB6MIvSo3u-5LpDRnL4v8kA';
        const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
        
        // Add these variables for tracking
        let playerStats = {
            gamesPlayed: 0,
            bestTime: Infinity,
            averageTime: 0,
            currentDifficulty: 'normal'
        };
        
        // Add AI interaction functions
        async function getGeminiResponse(prompt, endpoint = 'generate-word') {
            try {
                const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        prompt: endpoint === 'chat' ? prompt : undefined,
                        message: endpoint === 'chat' ? prompt : undefined
                    })
                });
        
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
        
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
        
                return endpoint === 'chat' ? data.response : data.word || data.hint || data.challenge;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        }
        
        // async function getAIChallenge() {
        //     const prompt = `Based on player stats:
        //         Games played: ${playerStats.gamesPlayed}
        //         Best time: ${playerStats.bestTime === Infinity ? 'None' : playerStats.bestTime}s
        //         Average time: ${playerStats.averageTime}s
        //         Current difficulty: ${playerStats.currentDifficulty}
                
        //         Generate a short, specific challenge for the memory game. Format: {time} seconds with {accuracy}% accuracy`;
            
        //     const challenge = await getGeminiResponse(prompt) || 'Complete in 60s with 90% accuracy';
        //     document.getElementById('aiChallenge').textContent = challenge;
        // }
        
        async function getAIHint() {
            const hintButton = document.getElementById('aiHint');
            const hintText = document.getElementById('hintText');
            
            hintButton.disabled = true;
            hintText.textContent = 'Getting AI hint...';
            hintText.classList.remove('hidden');
        
            const prompt = `Current game state:
                Matched pairs: ${matchedPairs}
                Time elapsed: ${seconds}s
                Remaining pairs: ${8 - matchedPairs}
                Provide a short, strategic hint for the memory game.`;
        
            const hint = await 'Focus on patterns and take your time!';
            hintText.textContent = hint;
            hintButton.disabled = false;
        }
        
        // Modify your endGame function
        // Remove the duplicate endGame function and keep the async version
        async function endGame() {
            gameStarted = false;
            clearInterval(timerInterval);
        
            // Update player stats
            playerStats.gamesPlayed++;
            const gameTime = seconds;
            playerStats.bestTime = Math.min(playerStats.bestTime, gameTime);
            playerStats.averageTime = (playerStats.averageTime * (playerStats.gamesPlayed - 1) + gameTime) / playerStats.gamesPlayed;
        
            // Get AI analysis
            // const analysisPrompt = `Analyze this memory game performance:
            //     Time: ${gameTime}s
            //     Best time: ${playerStats.bestTime}s
            //     Average time: ${playerStats.averageTime.toFixed(1)}s
            //     Games played: ${playerStats.gamesPlayed}
                
            //     Provide a brief, encouraging analysis and improvement suggestion.`;
        
            // const analysis = await getGeminiResponse(analysisPrompt) || 'Great job! Keep practicing to improve your time.';
        
            // Show custom end game modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md w-full">
                    <h2 class="text-2xl font-bold text-white mb-4">Game Completed! 🎉</h2>
                    <p class="text-gray-300 mb-4">Time: ${document.getElementById('timer').textContent}</p>
                    <button onclick="this.parentElement.parentElement.remove(); startGame();" 
                            class="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-6 py-2 rounded-full">
                        Play Again
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        
            // Generate new challenge for next game
            await getAIChallenge();
        }
        
        // Add event listener for AI hint button
        document.getElementById('aiHint').addEventListener('click', getAIHint);
        
        // Modify your startGame function to include AI challenge
        async function startGame() {
            const gameGrid = document.getElementById('gameGrid');
            gameGrid.innerHTML = '';
            matchedPairs = 0;
            seconds = 0;
            gameStarted = true;
            updateScore();

            const shuffledCards = shuffleCards([...cards]);
            shuffledCards.forEach((emoji, index) => {
                gameGrid.appendChild(createCard(emoji, index));
            });

            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(updateTimer, 1000);
        }

        // Consolidate game initialization
        // Remove these standalone event listeners as they're duplicated
        // Remove or comment out these lines:
        // document.getElementById('startWordGame').addEventListener('click', startWordRound);
        // document.getElementById('wordInput').addEventListener('keypress', (e) => {
        //     if (e.key === 'Enter') {
        //         checkWord();
        //     }
        // });
        
        // Keep only one DOMContentLoaded event listener and modify it
        // Update the DOMContentLoaded event listener
        document.addEventListener('DOMContentLoaded', () => {
        // Memory Game initialization
        const startGameButton = document.getElementById('startGame');
        if (startGameButton) {
            startGameButton.addEventListener('click', startGame);
        }
        
        // Word Game initialization
        const startWordGameButton = document.getElementById('startWordGame');
        const wordInput = document.getElementById('wordInput');
        
        if (startWordGameButton) {
            startWordGameButton.addEventListener('click', () => {
                startWordRound();
            });
        }
        
        if (wordInput) {
            wordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !wordInput.classList.contains('hidden')) {
                    e.preventDefault();
                    checkWord();
                }
            });
        }
        
        // Initialize AI hint button
        const aiHintButton = document.getElementById('aiHint');
        if (aiHintButton) {
            aiHintButton.addEventListener('click', getAIHint);
        }
        
        // Initialize word game
        resetGame();
        
        // Chatbot Game initialization
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendMessage');
        
        if (chatInput && sendButton) {
            sendButton.addEventListener('click', sendChatMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendChatMessage();
                }
            });
        }
        });

            // Add this to your script section
    // Word Game Variables
    let wordGameLevel = 1;
    let wordGameScore = 0;
    let currentWord = '';
    let wordDisplayTime = 3000; // Starting display time in milliseconds

    // Add these constants at the top of your script
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    async function getWordFromAI(retryCount = 0) {
        const difficultyLevel = wordGameLevel < 5 ? 'simple' : 'challenging';
        const minLength = wordGameLevel * 2;
        const maxLength = wordGameLevel * 3;
        
        const prompt = `Generate a unique, interesting ${difficultyLevel} word between ${minLength}-${maxLength} letters that would be suitable for a memory game. The word should be related to one of these themes: technology, nature, science, arts, or adventure. Return only the word in capital letters without any additional text or punctuation.`;
        
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
            const word = data.candidates[0]?.content?.parts[0]?.text?.trim().toUpperCase();

            if (!word || word.length < minLength || word.length > maxLength) {
                throw new Error('Invalid word received');
            }

            return word;
        } catch (error) {
            console.error('Error getting word from AI:', error);
            
            // Update UI with specific error message
            const wordDisplay = document.getElementById('wordDisplay');
            const errorMessage = error.name === 'AbortError' 
                ? 'Request timeout. Retrying...'
                : 'Network error. Retrying...';
            
            wordDisplay.innerHTML = `
                <div class="text-red-400 mb-4">
                    ⚠️ ${errorMessage}
                    ${retryCount > 0 ? `(Attempt ${retryCount}/${MAX_RETRIES})` : ''}
                </div>
            `;
            
            // Check retry count
            if (retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return getWordFromAI(retryCount + 1);
            } else {
                // If all retries failed, show error and provide fallback
                wordDisplay.innerHTML = `
                    <div class="text-red-400 mb-4">
                        ⚠️ Unable to connect to AI service. 
                        <button onclick="retryWordGame()" class="underline ml-2 hover:text-pink-500">
                            Try Again
                        </button>
                    </div>
                `;
                throw new Error('Max retries reached');
            }
        }
    }

    // Add this helper function to retry the game
    function retryWordGame() {
        const startButton = document.getElementById('startWordGame');
        startButton.classList.remove('hidden');
        document.getElementById('wordDisplay').innerHTML = '';
    }

    // Remove the generateFallbackWord function as we'll always use AI

    async function startWordRound() {
        const wordDisplay = document.getElementById('wordDisplay');
        const wordInput = document.getElementById('wordInput');
        const startButton = document.getElementById('startWordGame');
        
        // Prevent multiple calls while processing
        if (window.isProcessingRound) return;
        window.isProcessingRound = true;
        
        // Clear everything at start
        wordDisplay.innerHTML = '';
        wordInput.value = '';
        wordInput.classList.add('hidden');
        startButton.classList.add('hidden');
        
        try {
            // Show loading state
            wordDisplay.className = 'text-4xl font-bold text-white mb-8 min-h-[100px] flex items-center justify-center animate__animated';
            wordDisplay.innerHTML = '<div class="animate__animated animate__pulse">Generating word...</div>';
    
            const response = await fetch('http://localhost:5000/api/generate-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            currentWord = data.word;
            
            // Show the word
            wordDisplay.innerHTML = `<div class="animate__animated animate__fadeIn">${currentWord}</div>`;
            
            // Wait for word display duration
            await new Promise(resolve => {
                window.wordDisplayTimeout = setTimeout(resolve, 2000);
            });
            
            // Show input prompt
            wordDisplay.innerHTML = '<div class="animate__animated animate__fadeIn">Type the word you saw</div>';
            wordInput.classList.remove('hidden');
            wordInput.focus();
            
        } catch (error) {
            console.error('Error:', error);
            wordDisplay.innerHTML = '<div class="text-red-400">Error loading word. Please try again.</div>';
            startButton.classList.remove('hidden');
        } finally {
            window.isProcessingRound = false;
        }
    }

    // Update showFailure to properly clean up
    function showFailure() {
        if (window.wordDisplayTimeout) {
            clearTimeout(window.wordDisplayTimeout);
        }
        window.isProcessingRound = false;
        
        const wordDisplay = document.getElementById('wordDisplay');
        const wordInput = document.getElementById('wordInput');
        const startButton = document.getElementById('startWordGame');
        
        wordDisplay.innerHTML = `<div class="animate__animated animate__shakeX text-red-400">❌ Wrong! The word was: ${currentWord}</div>`;
        wordInput.classList.add('hidden');
        
        wordGameScore = 0;
        updateScore();
        currentWord = '';
        
        setTimeout(() => {
            startButton.classList.remove('hidden');
        }, 2000);
    }

    function checkWord() {
        const input = document.getElementById('wordInput');
        const userGuess = input.value.trim().toLowerCase();
        const wordDisplay = document.getElementById('wordDisplay');
        
        if (userGuess === currentWord.toLowerCase()) {
            // Increase score by 10 points
            wordGameScore += 10;
            updateScore();
            showSuccess();
        } else {
            showFailure();
        }
    }

    function showSuccess() {
        const wordDisplay = document.getElementById('wordDisplay');
        const wordInput = document.getElementById('wordInput');
        
        wordDisplay.innerHTML = '<div class="animate__animated animate__bounceIn text-green-400">🎉 Correct! +10 points!</div>';
        wordInput.classList.add('hidden');
        
        // Start next round after delay
        setTimeout(() => {
            startWordRound();
        }, 1500);
    }

    function showFailure() {
        const wordDisplay = document.getElementById('wordDisplay');
        const wordInput = document.getElementById('wordInput');
        const startButton = document.getElementById('startWordGame');
        
        wordDisplay.innerHTML = `<div class="animate__animated animate__shakeX text-red-400">❌ Wrong! The word was: ${currentWord}</div>`;
        wordInput.classList.add('hidden');
        
        // Reset score to zero when answer is wrong
        wordGameScore = 0;
        updateScore();
        
        // Show start button after delay
        setTimeout(() => {
            startButton.classList.remove('hidden');
        }, 2000);
    }

    function updateScore() {
        const scoreElement = document.getElementById('wordScore');
        scoreElement.textContent = wordGameScore;
    }

    function resetGame() {
        wordGameScore = 0;
        currentWord = '';
        updateScore();
        const wordInput = document.getElementById('wordInput');
        const startButton = document.getElementById('startWordGame');
        const wordDisplay = document.getElementById('wordDisplay');
        
        wordInput.classList.add('hidden');
        wordInput.value = '';
        startButton.classList.remove('hidden');
        wordDisplay.innerHTML = '';
    }

    // Add event listeners when the document loads
    document.addEventListener('DOMContentLoaded', () => {
        const startWordGameButton = document.getElementById('startWordGame');
        const wordInput = document.getElementById('wordInput');

        // Reset game state when initializing
        resetGame();

        if (startWordGameButton) {
            startWordGameButton.addEventListener('click', startWordRound);
        }

        if (wordInput) {
            wordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !wordInput.classList.contains('hidden')) {
                    e.preventDefault();
                    checkWord();
                }
            });
        }
    });

// Add at the top with other variables
const usedWords = new Set();

// Add the resetGame function
function resetGame() {
    wordGameLevel = 1;
    wordGameScore = 0;
    currentWord = '';
    usedWords.clear();
    updateScore();
    resetWordRound();
}

// Fix the DOMContentLoaded event listener (remove duplicate wordInput)
document.addEventListener('DOMContentLoaded', () => {
    // Memory Game initialization
    const startGameButton = document.getElementById('startGame');
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
    }

    // Word Game initialization
    const startWordGameButton = document.getElementById('startWordGame');
    const wordInput = document.getElementById('wordInput');

    if (startWordGameButton) {
        startWordGameButton.addEventListener('click', startWordRound);
    }

    if (wordInput) {
        wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !wordInput.classList.contains('hidden')) {
                e.preventDefault();
                checkWord();
            }
        });
    }

    // Initialize word game
    resetGame();
});

// Keep only this version of getWordFromAI and remove the other one
async function getWordFromAI() {
    try {
        let attempts = 0;
        
        while (attempts < 5) {
            const response = await fetch('http://localhost:5000/api/generate-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `Level ${wordGameLevel} word`
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            const newWord = data.word;
            
            // Validate word
            if (newWord && newWord.length >= 4 && !usedWords.has(newWord)) {
                usedWords.add(newWord);
                return newWord;
            }
            
            attempts++;
        }
        throw new Error('Could not generate valid word');
    } catch (error) {
        console.error('Error getting word from AI:', error);
        throw error;
    }
}

// Number Game Variables
let currentNumber = '';
let numberScore = 0;
let numberGameStarted = false;
let numberDisplayTimeout;

function startNumberRound() {
    const startButton = document.getElementById('startNumberGame');
    const numberDisplay = document.getElementById('numberDisplay');
    const numberInput = document.getElementById('numberInput');
    const errorMessage = document.getElementById('numberErrorMessage');

    // Reset display
    errorMessage.classList.add('hidden');
    numberInput.classList.add('hidden');
    numberInput.value = '';
    startButton.textContent = 'Memorize...';
    startButton.disabled = true;

    // Generate random number (length increases with score)
    const length = Math.min(3 + Math.floor(numberScore / 2), 9);
    currentNumber = '';
    for (let i = 0; i < length; i++) {
        currentNumber += Math.floor(Math.random() * 10).toString();
    }

    // Display number
    numberDisplay.textContent = currentNumber;
    
    // Hide number after delay and focus input
    const displayTime = Math.max(3000 - (numberScore * 200), 1000);
    numberDisplayTimeout = setTimeout(() => {
        numberDisplay.textContent = '?';
        numberInput.classList.remove('hidden');
        numberInput.focus(); // Add focus here
        startButton.textContent = 'Submit';
        startButton.disabled = false;
        numberGameStarted = true;
    }, displayTime);
}

function checkNumber() {
    const input = document.getElementById('numberInput');
    const errorMessage = document.getElementById('numberErrorMessage');
    const errorText = document.getElementById('numberErrorText');
    const startButton = document.getElementById('startNumberGame');
    const numberDisplay = document.getElementById('numberDisplay');

    if (input.value === currentNumber) {
        numberScore++;
        document.getElementById('numberScore').textContent = numberScore;
        startNumberRound();
        setTimeout(() => {
            input.focus();
        }, Math.max(3000 - (numberScore * 200), 1000) + 100);
    } else {
        // Reset score to zero
        numberScore = 0;
        document.getElementById('numberScore').textContent = numberScore;
        
        // Display error message with animation
        numberDisplay.innerHTML = `<div class="animate__animated animate__shakeX text-red-400">❌ Wrong! The number was: ${currentNumber}</div>`;
        numberInput.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        // Show start button after delay
        startButton.textContent = 'Try Again';
        numberGameStarted = false;
        setTimeout(() => {
            startButton.disabled = false;
        }, 2000);
    }
}

function resetNumberGame(continue_game = false) {
    const startButton = document.getElementById('startNumberGame');
    const numberDisplay = document.getElementById('numberDisplay');
    const numberInput = document.getElementById('numberInput');
    const errorMessage = document.getElementById('numberErrorMessage');

    clearTimeout(numberDisplayTimeout);
    numberDisplay.textContent = continue_game ? 'Ready for next number?' : 'Ready to start?';
    numberInput.classList.add('hidden');
    errorMessage.classList.add('hidden');
    startButton.textContent = 'Start Game';
    startButton.disabled = false;
    numberGameStarted = false;
}

function retryNumberGame() {
    numberScore = 0;
    document.getElementById('numberScore').textContent = numberScore;
    resetNumberGame();
}

// Add to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Number Game initialization
    const startNumberGameButton = document.getElementById('startNumberGame');
    const numberInput = document.getElementById('numberInput');

    if (startNumberGameButton) {
        startNumberGameButton.addEventListener('click', () => {
            if (!numberGameStarted) {
                startNumberRound();
                numberGameStarted = true;
            } else {
                checkNumber();
            }
        });
    }

    if (numberInput) {
        numberInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && numberGameStarted) {
                e.preventDefault();
                checkNumber();
            }
        });
    }

    // Initialize number game
    resetNumberGame();
});
    
//grid master
// Add at the top with other game variables
let visualGameLevel = 1;
let visualScore = 0;
let visualLives = 3;
let visualPattern = [];
let userPattern = [];
let isShowingPattern = false;
let correctAttempts = 0;

function startVisualGame() {
    visualGameLevel = 1;
    visualScore = 0;
    visualLives = 3;
    correctAttempts = 0;
    updateVisualStats();
    showVisualPattern();
}

function updateVisualStats() {
    document.getElementById('visualLevel').textContent = visualGameLevel;
    document.getElementById('visualScore').textContent = visualScore;
    document.getElementById('visualLives').textContent = '❤️'.repeat(visualLives);
}

function createVisualGrid() {
    const grid = document.getElementById('visualGrid');
    // Adjust grid size based on level progression
    const size = visualGameLevel <= 2 ? 3 : 
                 visualGameLevel <= 4 ? 4 : 
                 visualGameLevel <= 6 ? 5 : 6;
    
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'w-16 h-16 bg-white/10 backdrop-blur-lg rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-105';
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', () => handleCellClick(i));
        grid.appendChild(cell);
    }
}

function showVisualPattern() {
    isShowingPattern = true;
    createVisualGrid();
    const size = visualGameLevel <= 2 ? 3 : 
                 visualGameLevel <= 4 ? 4 : 
                 visualGameLevel <= 6 ? 5 : 6;
    const totalCells = size * size;
    const numCellsToShow = Math.min(visualGameLevel + 2, Math.floor(totalCells / 2));
    
    visualPattern = [];
    while (visualPattern.length < numCellsToShow) {
        const randomCell = Math.floor(Math.random() * totalCells);
        if (!visualPattern.includes(randomCell)) {
            visualPattern.push(randomCell);
        }
    }

    // Show pattern with animation
    visualPattern.forEach((cellIndex, i) => {
        setTimeout(() => {
            const cell = document.querySelector(`[data-index="${cellIndex}"]`);
            cell.classList.add('bg-pink-500');
            
            // Remove highlight and enable interaction after last square
            setTimeout(() => {
                cell.classList.remove('bg-pink-500');
                if (i === visualPattern.length - 1) {
                    isShowingPattern = false;
                    userPattern = [];
                }
            }, 800);
        }, i * 1000);
    });
}

function handleCellClick(index) {
    if (isShowingPattern) return;

    const cell = document.querySelector(`[data-index="${index}"]`);
    // Enhanced click animation with color transition
    cell.classList.add('bg-pink-500', 'animate__animated', 'animate__flipInY');
    setTimeout(() => {
        cell.classList.remove('bg-violet-500', 'animate__animated', 'animate__flipInY');
        cell.classList.add('bg-white/30');
        setTimeout(() => cell.classList.remove('bg-white/30'), 300);
    }, 300);

    userPattern.push(index);
    checkPattern();
}

function createVisualGrid() {
    const grid = document.getElementById('visualGrid');
    const size = visualGameLevel <= 2 ? 3 : 
                 visualGameLevel <= 4 ? 4 : 
                 visualGameLevel <= 6 ? 5 : 6;
    
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        // Enhanced cell styling with hover effects
        cell.className = 'w-16 h-16 bg-white/10 backdrop-blur-lg rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-pink-500/30 hover:shadow-lg hover:shadow-pink-500/25';
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', () => handleCellClick(i));
        grid.appendChild(cell);
    }
}

function checkPattern() {
    const currentLength = userPattern.length;
    const isCorrect = userPattern[currentLength - 1] === visualPattern[currentLength - 1];

    if (!isCorrect) {
        visualLives--;
        updateVisualStats();
        showFailureAnimation();
        
        if (visualLives <= 0) {
            gameOverVisual();
            return;
        }
        
        setTimeout(showVisualPattern, 1000);
        return;
    }

    if (currentLength === visualPattern.length) {
        visualScore += 10;
        correctAttempts++;
        
        if (correctAttempts >= 2) {
            visualGameLevel++;
            correctAttempts = 0;
        }
        
        updateVisualStats();
        showSuccessAnimation();
        setTimeout(showVisualPattern, 1000);
    }
}

function showSuccessAnimation() {
    const grid = document.getElementById('visualGrid');
    grid.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => grid.classList.remove('animate__animated', 'animate__pulse'), 500);
}

function showFailureAnimation() {
    const grid = document.getElementById('visualGrid');
    grid.classList.add('animate__animated', 'animate__shakeX');
    setTimeout(() => grid.classList.remove('animate__animated', 'animate__shakeX'), 500);
}

function gameOverVisual() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md w-full">
            <h2 class="text-2xl font-bold text-white mb-4">Game Over! 🎮</h2>
            <p class="text-gray-300 mb-4">Final Score: ${visualScore}</p>
            <p class="text-gray-300 mb-4">Level Reached: ${visualGameLevel}</p>
            <button onclick="this.parentElement.parentElement.remove(); startVisualGame();" 
                    class="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-6 py-2 rounded-full">
                Try Again
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Add to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Visual Game initialization
    const startVisualGameButton = document.getElementById('startVisualGame');
    if (startVisualGameButton) {
        startVisualGameButton.addEventListener('click', startVisualGame);
    }

    // Initialize visual game stats
    const visualLevelElement = document.getElementById('visualLevel');
    const visualScoreElement = document.getElementById('visualScore');
    const visualLivesElement = document.getElementById('visualLives');
    
    if (visualLevelElement && visualScoreElement && visualLivesElement) {
        visualLevelElement.textContent = '1';
        visualScoreElement.textContent = '0';
        visualLivesElement.textContent = '❤️❤️❤️';
    }
});

// reaction time
// Add at the top with other game variables
let reactionStartTime = 0;
let reactionTimeout = null;
let bestReactionTime = Infinity;
let isReactionGameStarted = false;

function startReactionGame() {
    const reactionBox = document.getElementById('reactionBox');
    const startButton = document.getElementById('startReactionGame');
    
    startButton.classList.add('hidden');
    reactionBox.style.backgroundColor = 'rgb(31, 41, 55)';
    reactionBox.textContent = 'Wait for green...';
    
    // Random delay between 1-5 seconds
    const delay = Math.random() * 4000 + 1000;
    reactionTimeout = setTimeout(() => {
        reactionBox.style.backgroundColor = '#22c55e';
        reactionBox.textContent = 'Click Now!';
        reactionStartTime = Date.now();
        isReactionGameStarted = true;
    }, delay);

    // Add click handler
    reactionBox.onclick = handleReactionClick;
}

function handleReactionClick() {
    const reactionBox = document.getElementById('reactionBox');
    const startButton = document.getElementById('startReactionGame');
    
    if (!isReactionGameStarted) {
        // Clicked too early
        clearTimeout(reactionTimeout);
        reactionBox.style.backgroundColor = '#ef4444';
        reactionBox.textContent = 'Too early! Try again.';
        startButton.classList.remove('hidden');
        return;
    }

    const reactionTime = Date.now() - reactionStartTime;
    bestReactionTime = Math.min(bestReactionTime, reactionTime);
    
    // Update displays
    document.getElementById('lastReactionTime').textContent = `${reactionTime}ms`;
    document.getElementById('bestReactionTime').textContent = `${bestReactionTime}ms`;
    
    // Reset for next round
    reactionBox.style.backgroundColor = '#8b5cf6';
    reactionBox.textContent = 'Click to try again!';
    startButton.classList.remove('hidden');
    isReactionGameStarted = false;
}

// Add to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...

    // Reaction Game initialization
    const startReactionGameButton = document.getElementById('startReactionGame');
    if (startReactionGameButton) {
        startReactionGameButton.addEventListener('click', startReactionGame);
    }
});

// Chatbot Game Variables
let chatGameState = {
    isPlaying: false,
    currentGame: null,
    score: 0,
    level: 1
};

// Chatbot Game Functions
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';
    
    try {
        // Get AI response
        const response = await getGeminiResponse(message, 'chat');
        
        // Add bot response to chat
        addMessageToChat(response, 'bot');
        
        // Handle game state based on response
        handleGameState(response);
    } catch (error) {
        console.error('Chat error:', error);
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message mb-4`;
    
    const messageContent = document.createElement('div');
    messageContent.className = `bg-white/20 rounded-lg p-3 inline-block max-w-[80%] ${sender === 'user' ? 'ml-auto' : ''}`;
    messageContent.innerHTML = `<p class="text-white">${message}</p>`;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleGameState(response) {
    if (response.toLowerCase().includes('start')) {
        chatGameState.isPlaying = true;
        chatGameState.currentGame = 'memory';
        chatGameState.score = 0;
        chatGameState.level = 1;
    }
}

// Initialize Chatbot Game
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization code ...
    
    // Chatbot Game initialization
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    
    if (chatInput && sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
});