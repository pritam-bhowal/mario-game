// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game state
let score = 0;
let gameRunning = true;

// Game objects
const mario = {
    x: 50,
    y: 300,
    width: 30,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 15,
    onGround: false,
    color: '#FF0000'
};

const enemies = [
    { x: 300, y: 320, width: 25, height: 25, velocityX: -1, color: '#8B0000' },
    { x: 500, y: 320, width: 25, height: 25, velocityX: -1, color: '#8B0000' },
    { x: 700, y: 320, width: 25, height: 25, velocityX: -1, color: '#8B0000' }
];

const platforms = [
    { x: 0, y: 360, width: 800, height: 40, color: '#8B4513' }, // Ground
    { x: 200, y: 280, width: 100, height: 20, color: '#228B22' },
    { x: 400, y: 220, width: 100, height: 20, color: '#228B22' },
    { x: 600, y: 160, width: 100, height: 20, color: '#228B22' }
];

const coins = [
    { x: 250, y: 250, width: 15, height: 15, collected: false, color: '#FFD700' },
    { x: 450, y: 190, width: 15, height: 15, collected: false, color: '#FFD700' },
    { x: 650, y: 130, width: 15, height: 15, collected: false, color: '#FFD700' }
];

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    // Restart game
    if (e.code === 'KeyR') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Game functions
function updateMario() {
    // Horizontal movement
    if (keys['ArrowLeft']) {
        mario.velocityX = -mario.speed;
    } else if (keys['ArrowRight']) {
        mario.velocityX = mario.speed;
    } else {
        mario.velocityX *= 0.8; // Friction
    }
    
    // Jumping
    if (keys['Space'] && mario.onGround) {
        mario.velocityY = -mario.jumpPower;
        mario.onGround = false;
    }
    
    // Apply gravity
    mario.velocityY += 0.8;
    
    // Update position
    mario.x += mario.velocityX;
    mario.y += mario.velocityY;
    
    // Keep Mario in bounds
    if (mario.x < 0) mario.x = 0;
    if (mario.x + mario.width > canvas.width) mario.x = canvas.width - mario.width;
    
    // Check platform collisions
    mario.onGround = false;
    for (let platform of platforms) {
        if (mario.x < platform.x + platform.width &&
            mario.x + mario.width > platform.x &&
            mario.y < platform.y + platform.height &&
            mario.y + mario.height > platform.y) {
            
            // Landing on top of platform
            if (mario.velocityY > 0 && mario.y < platform.y) {
                mario.y = platform.y - mario.height;
                mario.velocityY = 0;
                mario.onGround = true;
            }
        }
    }
    
    // Fall off screen
    if (mario.y > canvas.height) {
        gameOver();
    }
}

function updateEnemies() {
    for (let enemy of enemies) {
        enemy.x += enemy.velocityX;
        
        // Bounce off edges
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            enemy.velocityX *= -1;
        }
        
        // Check collision with Mario
        if (mario.x < enemy.x + enemy.width &&
            mario.x + mario.width > enemy.x &&
            mario.y < enemy.y + enemy.height &&
            mario.y + mario.height > enemy.y) {
            
            // Mario jumps on enemy
            if (mario.velocityY > 0 && mario.y < enemy.y) {
                // Remove enemy
                const index = enemies.indexOf(enemy);
                enemies.splice(index, 1);
                mario.velocityY = -10; // Bounce
                score += 100;
            } else {
                // Mario gets hit
                gameOver();
            }
        }
    }
}

function updateCoins() {
    for (let coin of coins) {
        if (!coin.collected &&
            mario.x < coin.x + coin.width &&
            mario.x + mario.width > coin.x &&
            mario.y < coin.y + coin.height &&
            mario.y + mario.height > coin.y) {
            
            coin.collected = true;
            score += 50;
        }
    }
}

function drawMario() {
    ctx.fillStyle = mario.color;
    ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
    
    // Draw Mario's hat
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(mario.x - 5, mario.y - 5, mario.width + 10, 10);
    
    // Draw Mario's overalls
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(mario.x + 5, mario.y + 15, mario.width - 10, 15);
    
    // Draw Mario's face
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(mario.x + 5, mario.y + 5, mario.width - 10, 10);
}

function drawEnemies() {
    for (let enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw enemy eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
        ctx.fillRect(enemy.x + 15, enemy.y + 5, 5, 5);
        
        // Draw enemy pupils
        ctx.fillStyle = '#000000';
        ctx.fillRect(enemy.x + 6, enemy.y + 6, 3, 3);
        ctx.fillRect(enemy.x + 16, enemy.y + 6, 3, 3);
    }
}

function drawPlatforms() {
    for (let platform of platforms) {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add some texture
        ctx.fillStyle = '#654321';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
    }
}

function drawCoins() {
    for (let coin of coins) {
        if (!coin.collected) {
            ctx.fillStyle = coin.color;
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add shine
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2 - 2, coin.y + coin.height/2 - 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(100, 80, 20, 0, Math.PI * 2);
    ctx.arc(120, 80, 25, 0, Math.PI * 2);
    ctx.arc(140, 80, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(500, 60, 20, 0, Math.PI * 2);
    ctx.arc(520, 60, 25, 0, Math.PI * 2);
    ctx.arc(540, 60, 20, 0, Math.PI * 2);
    ctx.fill();
}

function updateScore() {
    scoreElement.textContent = score;
}

function gameOver() {
    gameRunning = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2);
    ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 50);
}

function restartGame() {
    // Reset game state
    score = 0;
    gameRunning = true;
    
    // Reset Mario
    mario.x = 50;
    mario.y = 300;
    mario.velocityX = 0;
    mario.velocityY = 0;
    mario.onGround = false;
    
    // Reset enemies
    enemies.length = 0;
    enemies.push(
        { x: 300, y: 320, width: 25, height: 25, velocityX: -1, color: '#8B0000' },
        { x: 500, y: 320, width: 25, height: 25, velocityX: -1, color: '#8B0000' },
        { x: 700, y: 320, width: 25, height: 25, velocityX: -1, color: '#8B0000' }
    );
    
    // Reset coins
    for (let coin of coins) {
        coin.collected = false;
    }
    
    updateScore();
}

function gameLoop() {
    if (gameRunning) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update game objects
        updateMario();
        updateEnemies();
        updateCoins();
        
        // Draw everything
        drawBackground();
        drawPlatforms();
        drawCoins();
        drawEnemies();
        drawMario();
        
        updateScore();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop(); 