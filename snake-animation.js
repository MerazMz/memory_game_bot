// Snake Game Background Animation
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('snake-game-bg');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to window size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Call resize on load and window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Game settings
    const gridSize = 20;
    const snakeSpeed = 5; // Frames per movement
    
    // Theme colors matching site
    const colors = {
        snake: {
            head: '#ec4899', // Pink from the site
            body: '#8b5cf6', // Purple from the site
            bodyAlt: '#7c54e2' // Slightly lighter purple for alternating segments
        },
        food: '#ec4899', // Pink for food
        glow: 'rgba(236, 72, 153, 0.4)', // Pinkish glow - increased opacity
        trail: 'rgba(139, 92, 246, 0.2)' // Subtle purple trail - increased opacity
    };
    
    // Snake properties
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let frameCount = 0;
    let snakeLength = 20; // Increased initial size from 5 to 20
    
    // Trail effect
    let trails = [];
    const maxTrails = 60;
    
    // Particle system for food
    let particles = [];
    const maxParticles = 20;
    
    // Initialize snake
    function initSnake() {
        snake = [];
        const centerX = Math.floor(canvas.width / (2 * gridSize));
        const centerY = Math.floor(canvas.height / (2 * gridSize));
        
        // Start with a snake of length 20 (increased from 5)
        for (let i = 0; i < snakeLength; i++) {
            snake.push({
                x: centerX - i,
                y: centerY
            });
        }
        
        // Clear trails
        trails = [];
        
        // Generate first food
        createFood();
    }
    
    // Create food at random position
    function createFood() {
        // Get a position that's not on the snake
        let validPosition = false;
        while (!validPosition) {
            food = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)),
                y: Math.floor(Math.random() * (canvas.height / gridSize))
            };
            
            // Check if food is on snake
            validPosition = true;
            for (let segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        // Create burst of particles at new food location
        createParticleBurst(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, 10);
    }
    
    // Create a single particle
    function createParticle(x, y, speed, angle, size, life) {
        return {
            x: x,
            y: y,
            speed: speed,
            angle: angle,
            size: size,
            life: life,
            maxLife: life,
            color: colors.food
        };
    }
    
    // Create a burst of particles
    function createParticleBurst(x, y, count) {
        for (let i = 0; i < count; i++) {
            const speed = 0.5 + Math.random() * 1.5;
            const angle = Math.random() * Math.PI * 2;
            const size = 1 + Math.random() * 3;
            const life = 30 + Math.random() * 20;
            
            particles.push(createParticle(x, y, speed, angle, size, life));
            
            // Limit particles
            if (particles.length > maxParticles) {
                particles.shift();
            }
        }
    }
    
    // Update particles
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Move particle
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            
            // Reduce life
            p.life--;
            
            // Remove dead particles
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }
    
    // Draw particles
    function drawParticles() {
        for (let p of particles) {
            const alpha = p.life / p.maxLife;
            // Increased base opacity by adjusting the alpha calculation
            const adjustedAlpha = Math.min(1, alpha * 1.5);
            ctx.fillStyle = p.color + Math.floor(adjustedAlpha * 255).toString(16).padStart(2, '0');
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Main game loop
    function gameLoop() {
        frameCount++;
        
        // Only move the snake every few frames for slower movement
        if (frameCount >= snakeSpeed) {
            frameCount = 0;
            moveSnake();
            checkCollision();
        }
        
        // Update particles every frame
        updateParticles();
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw trails
        drawTrails();
        
        // Draw particles
        drawParticles();
        
        // Draw food with glow effect
        drawFood();
        
        // Draw snake
        drawSnake();
        
        // Next animation frame
        requestAnimationFrame(gameLoop);
    }
    
    // Move the snake based on direction
    function moveSnake() {
        // Update direction from next direction
        direction = nextDirection;
        
        // Calculate next head position
        const head = {
            x: snake[0].x,
            y: snake[0].y
        };
        
        switch (direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // Wrap around edges
        if (head.x < 0) head.x = Math.floor(canvas.width / gridSize) - 1;
        if (head.x >= Math.floor(canvas.width / gridSize)) head.x = 0;
        if (head.y < 0) head.y = Math.floor(canvas.height / gridSize) - 1;
        if (head.y >= Math.floor(canvas.height / gridSize)) head.y = 0;
        
        // Add new head
        snake.unshift(head);
        
        // Add trail at the position of the last segment
        if (snake.length > 0) {
            const tail = snake[snake.length - 1];
            trails.push({
                x: tail.x * gridSize + gridSize / 2,
                y: tail.y * gridSize + gridSize / 2,
                size: gridSize * 0.8,
                alpha: 0.9  // Increased from 0.7 to 0.9
            });
            
            // Limit trails
            if (trails.length > maxTrails) {
                trails.shift();
            }
        }
        
        // Remove tail unless food was eaten
        if (head.x === food.x && head.y === food.y) {
            createFood();
            
            // Create visual effect when food is eaten
            createParticleBurst(head.x * gridSize + gridSize/2, head.y * gridSize + gridSize/2, 15);
            
            // Limit max length to prevent performance issues
            if (snake.length < 40) {  // Increased from 30 to 40 to allow growth beyond 20
                // Keep tail (don't remove)
            } else {
                snake.pop();
            }
        } else {
            snake.pop();
        }
        
        // Randomly change direction occasionally to make it more interesting
        if (Math.random() < 0.03) {
            changeDirectionRandomly();
        }
        
        // Direct toward food sometimes
        if (Math.random() < 0.2) {
            moveTowardFood();
        }
    }
    
    // Draw trails
    function drawTrails() {
        for (let i = trails.length - 1; i >= 0; i--) {
            const trail = trails[i];
            
            // Fade out more slowly
            trail.alpha *= 0.94;  // Changed from 0.92 to 0.94
            trail.size *= 0.96;
            
            if (trail.alpha < 0.01) {
                trails.splice(i, 1);
                continue;
            }
            
            // Draw trail with increased opacity
            ctx.fillStyle = colors.trail;
            ctx.globalAlpha = trail.alpha * 1.3;  // Multiply by 1.3 to increase opacity
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, trail.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    // Change direction randomly (but not backwards)
    function changeDirectionRandomly() {
        const directions = ['up', 'down', 'left', 'right'];
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        // Filter out current direction and its opposite
        const validDirections = directions.filter(dir => 
            dir !== direction && dir !== opposites[direction]
        );
        
        // Choose a random valid direction
        const newDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
        nextDirection = newDirection;
    }
    
    // Move toward food
    function moveTowardFood() {
        const head = snake[0];
        
        // Decide horizontal or vertical movement
        if (Math.random() < 0.5) {
            // Move horizontally toward food
            if (food.x < head.x && direction !== 'right') {
                nextDirection = 'left';
            } else if (food.x > head.x && direction !== 'left') {
                nextDirection = 'right';
            }
        } else {
            // Move vertically toward food
            if (food.y < head.y && direction !== 'down') {
                nextDirection = 'up';
            } else if (food.y > head.y && direction !== 'up') {
                nextDirection = 'down';
            }
        }
    }
    
    // Check for collision with self
    function checkCollision() {
        const head = snake[0];
        
        // Check collision with self (skip the head)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                // Restart the snake
                initSnake();
                break;
            }
        }
    }
    
    // Draw the snake
    function drawSnake() {
        snake.forEach((segment, index) => {
            const x = segment.x * gridSize;
            const y = segment.y * gridSize;
            
            // Head has different color
            if (index === 0) {
                ctx.fillStyle = colors.snake.head;
                
                // Draw circular head
                ctx.beginPath();
                ctx.arc(
                    x + gridSize / 2, 
                    y + gridSize / 2, 
                    gridSize / 2, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
                
                // Add glow to head with increased intensity
                ctx.shadowBlur = 15;  // Increased from 10 to 15
                ctx.shadowColor = colors.glow;
                ctx.beginPath();
                ctx.arc(
                    x + gridSize / 2, 
                    y + gridSize / 2, 
                    gridSize / 2, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Draw eye
                ctx.fillStyle = '#ffffff';
                
                // Position eye based on direction
                let eyeX = x + gridSize / 2;
                let eyeY = y + gridSize / 2;
                
                switch (direction) {
                    case 'up':
                        eyeX -= gridSize / 5;
                        eyeY -= gridSize / 5;
                        break;
                    case 'down':
                        eyeX += gridSize / 5;
                        eyeY += gridSize / 5;
                        break;
                    case 'left':
                        eyeX -= gridSize / 5;
                        eyeY -= gridSize / 5;
                        break;
                    case 'right':
                        eyeX += gridSize / 5;
                        eyeY -= gridSize / 5;
                        break;
                }
                
                // Draw two small eye circles
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, gridSize / 10, 0, Math.PI * 2);
                ctx.fill();
                
            } else {
                // Alternating body colors
                ctx.fillStyle = index % 2 ? colors.snake.body : colors.snake.bodyAlt;
                
                // Slightly smaller body segments for a chain effect
                const padding = 1;
                ctx.fillRect(
                    x + padding, 
                    y + padding, 
                    gridSize - padding * 2, 
                    gridSize - padding * 2
                );
            }
        });
    }
    
    // Draw food with glow effect
    function drawFood() {
        const x = food.x * gridSize;
        const y = food.y * gridSize;
        
        // Pulsating size for food
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        const size = gridSize * pulse;
        
        // Glow effect with increased intensity
        ctx.shadowBlur = 20;  // Increased from 15 to 20
        ctx.shadowColor = colors.glow;
        
        // Draw food
        ctx.fillStyle = colors.food;
        ctx.beginPath();
        ctx.arc(
            x + gridSize / 2, 
            y + gridSize / 2, 
            size / 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw outer glow ring with increased opacity
        ctx.strokeStyle = colors.food;
        ctx.lineWidth = 2;  // Increased from 1 to 2
        ctx.beginPath();
        ctx.arc(
            x + gridSize / 2,
            y + gridSize / 2,
            size / 1.5 + Math.sin(Date.now() / 300) * 3,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    // Create multiple snakes for more visual interest
    function createMultipleSnakes() {
        // We'll keep our main snake at index 0 and add some "dummy" snakes
        // that follow simplified rules
        
        // Add 2 more dummy snakes
        for (let i = 0; i < 2; i++) {
            const startX = Math.floor(Math.random() * (canvas.width / gridSize));
            const startY = Math.floor(Math.random() * (canvas.height / gridSize));
            
            // Create a small snake
            const dummySnake = [];
            for (let j = 0; j < 3; j++) {
                dummySnake.push({ x: startX - j, y: startY });
            }
            
            // Add to snake array (our main snake is at index 0)
            snake.push(...dummySnake);
        }
    }
    
    // Start the game
    initSnake();
    gameLoop();
}); 