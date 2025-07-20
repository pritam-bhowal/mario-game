// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const flowersElement = document.getElementById('flowers');
const princessMessage = document.getElementById('princess-message');

// Game state
let score = 0;
let gameRunning = true;
let level = 1;
let maxLevel = 5;
let lives = 5; // Start with more lives
let flowersCollected = 0;
let flowersThisLevel = 0;
let invincible = false;
let invincibleTimeout = null;

// Game objects
const mario = {
    x: 50,
    y: 300,
    width: 30,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 19, // Increased jump height
    onGround: false,
    color: '#FF0000'
};

let enemies = [];
let platforms = [];
let flowers = [];

function randomColor() {
    const colors = ['#FF69B4', '#FFD700', '#ADFF2F', '#00BFFF', '#FF6347', '#BA55D3'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function randomFlowerType() {
    const types = ['tulip', 'rose', 'daisy', 'sunflower', 'lily'];
    return types[Math.floor(Math.random() * types.length)];
}

function randomizeLevel() {
    // Random platforms
    platforms = [
        { x: 0, y: 360, width: 800, height: 40, color: '#8B4513' }
    ];
    let numPlatforms = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPlatforms; i++) {
        let width = 80 + Math.floor(Math.random() * 80);
        let x = 100 + Math.floor(Math.random() * 600);
        let y = 120 + Math.floor(Math.random() * 200);
        platforms.push({ x, y, width, height: 20, color: '#228B22' });
    }
    // Knights always on the ground
    enemies = [];
    let numEnemies = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numEnemies; i++) {
        let ex = Math.random() * (800 - 30); // anywhere on ground
        let speed = 1.5 + Math.random() * 2.5;
        let dir = Math.random() < 0.5 ? 1 : -1;
        enemies.push({ x: ex, y: 320, width: 30, height: 40, velocityX: speed * dir, color: '#444', knight: true });
    }
    // Random flowers (still on upper platforms)
    flowers = [];
    let numFlowers = 2 + Math.floor(Math.random() * 4);
    flowersThisLevel = numFlowers;
    for (let i = 0; i < numFlowers; i++) {
        let plat = platforms[1 + Math.floor(Math.random() * (platforms.length - 1))];
        let fx = plat.x + Math.random() * (plat.width - 20);
        flowers.push({ x: fx, y: plat.y - 20, width: 20, height: 20, collected: false, color: randomColor(), type: randomFlowerType() });
    }
}

function startLevel() {
    mario.x = 50;
    mario.y = 300;
    mario.velocityX = 0;
    mario.velocityY = 0;
    mario.onGround = false;
    randomizeLevel();
    updateUI();
}

function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    livesElement.textContent = lives;
    flowersElement.textContent = flowersCollected;
}

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyR') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function updateMario() {
    if (!gameRunning) return;
    if (keys['ArrowLeft']) {
        mario.velocityX = -mario.speed;
    } else if (keys['ArrowRight']) {
        mario.velocityX = mario.speed;
    } else {
        mario.velocityX *= 0.8;
    }
    if (keys['Space'] && mario.onGround) {
        mario.velocityY = -mario.jumpPower;
        mario.onGround = false;
    }
    mario.velocityY += 0.8;
    mario.x += mario.velocityX;
    mario.y += mario.velocityY;
    // Level progression
    if (mario.x + mario.width >= canvas.width) {
        if (level < maxLevel) {
            level++;
            startLevel();
        } else {
            winGame();
        }
        return;
    }
    if (mario.x < 0) mario.x = 0;
    if (mario.x + mario.width > canvas.width) mario.x = canvas.width - mario.width;
    mario.onGround = false;
    for (let platform of platforms) {
        if (mario.x < platform.x + platform.width &&
            mario.x + mario.width > platform.x &&
            mario.y < platform.y + platform.height &&
            mario.y + mario.height > platform.y) {
            if (mario.velocityY > 0 && mario.y < platform.y) {
                mario.y = platform.y - mario.height;
                mario.velocityY = 0;
                mario.onGround = true;
            }
        }
    }
    if (mario.y > canvas.height) {
        loseLife();
    }
}

function updateEnemies() {
    for (let enemy of enemies) {
        enemy.x += enemy.velocityX;
        // Knights patrol the ground (full width)
        if (enemy.x <= 0 || enemy.x + enemy.width >= 800) {
            enemy.velocityX *= -1;
        }
        // Collision with Mario
        // Make knight hitbox a bit shorter for collision
        let knightCollisionHeight = enemy.height - 10;
        if (mario.x < enemy.x + enemy.width &&
            mario.x + mario.width > enemy.x &&
            mario.y < enemy.y + knightCollisionHeight &&
            mario.y + mario.height > enemy.y) {
            // More forgiving stomp window: allow Mario to stomp if his bottom is above enemy's center
            if (mario.velocityY > 0 && mario.y + mario.height - 8 < enemy.y + knightCollisionHeight / 2) {
                // Mario jumps on knight
                const index = enemies.indexOf(enemy);
                enemies.splice(index, 1);
                mario.velocityY = -10;
                score += 100;
            } else {
                loseLife();
            }
        }
    }
}

function updateFlowers() {
    for (let flower of flowers) {
        if (!flower.collected &&
            mario.x < flower.x + flower.width &&
            mario.x + mario.width > flower.x &&
            mario.y < flower.y + flower.height &&
            mario.y + mario.height > flower.y) {
            flower.collected = true;
            flowersCollected++;
            score += 50;
        }
    }
}

function drawMario() {
    ctx.fillStyle = mario.color;
    ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(mario.x - 5, mario.y - 5, mario.width + 10, 10);
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(mario.x + 5, mario.y + 15, mario.width - 10, 15);
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(mario.x + 5, mario.y + 5, mario.width - 10, 10);
}

function drawEnemies() {
    for (let enemy of enemies) {
        // Draw medieval knight: helmet, armor, plume
        ctx.fillStyle = '#888'; // Armor
        ctx.fillRect(enemy.x, enemy.y + 10, enemy.width, enemy.height - 10);
        ctx.fillStyle = '#444'; // Helmet
        ctx.fillRect(enemy.x, enemy.y, enemy.width, 15);
        ctx.fillStyle = '#FFD700'; // Plume
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y, 7, 0, Math.PI, true);
        ctx.fill();
        // Face
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(enemy.x + 7, enemy.y + 7, enemy.width - 14, 8);
        // Shield
        ctx.fillStyle = '#B22222';
        ctx.fillRect(enemy.x - 5, enemy.y + 20, 8, 18);
        // Sword
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(enemy.x + enemy.width - 3, enemy.y + 25, 3, 15);
    }
}

function drawPlatforms() {
    for (let platform of platforms) {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.fillStyle = '#654321';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
    }
}

function drawFlowers() {
    for (let flower of flowers) {
        if (!flower.collected) {
            // Draw stem
            ctx.fillStyle = '#228B22';
            ctx.fillRect(flower.x + flower.width / 2 - 2, flower.y + 10, 4, 10);
            // Draw petals
            ctx.fillStyle = flower.color;
            for (let i = 0; i < 6; i++) {
                let angle = (i / 6) * 2 * Math.PI;
                ctx.beginPath();
                ctx.arc(flower.x + flower.width / 2 + Math.cos(angle) * 7, flower.y + 10 + Math.sin(angle) * 7, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
            // Draw center
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(flower.x + flower.width / 2, flower.y + 10, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

function drawPrincess() {
    // Draw princess at the right edge on level 5
    ctx.save();
    ctx.translate(canvas.width - 70, 260);
    // Dress
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.ellipse(20, 40, 20, 30, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Head
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.arc(20, 15, 12, 0, 2 * Math.PI);
    ctx.fill();
    // Crown
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(12, 8);
    ctx.lineTo(20, 0);
    ctx.lineTo(28, 8);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(16, 18, 2, 0, 2 * Math.PI);
    ctx.arc(24, 18, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    updateUI();
}

let lifeLostTimeout = null;
let showLifeLostMessage = false;

function loseLife() {
    if (lifeLostTimeout || invincible) return; // Prevent multiple triggers or if invincible
    lives--;
    updateUI();
    if (lives <= 0) {
        gameOver();
    } else {
        showLifeLostMessage = true;
        princessMessage.style.display = 'block';
        princessMessage.innerHTML = `<span style='color:#B22222'>You lost a life!</span><br>Lives left: ${lives}`;
        lifeLostTimeout = setTimeout(() => {
            showLifeLostMessage = false;
            princessMessage.style.display = 'none';
            mario.x = 50;
            mario.y = 300;
            mario.velocityX = 0;
            mario.velocityY = 0;
            mario.onGround = false;
            lifeLostTimeout = null;
            // Grant temporary invincibility
            invincible = true;
            invincibleTimeout = setTimeout(() => { invincible = false; }, 2000);
        }, 1500);
    }
}

function gameOver() {
    gameRunning = false;
    princessMessage.style.display = 'block';
    princessMessage.innerHTML = `<span style='color:#B22222'>GAME OVER</span><br>Flowers collected: ${flowersCollected}<br>Press R to restart`;
}

function winGame() {
    gameRunning = false;
    princessMessage.style.display = 'block';
    princessMessage.innerHTML = `🎉 Mario rescued the princess! 🎉<br>He gifted her <b>${flowersCollected}</b> beautiful flowers!<br>Press R to play again.`;
}

function restartGame() {
    score = 0;
    level = 1;
    lives = 5;
    flowersCollected = 0;
    princessMessage.style.display = 'none';
    gameRunning = true;
    if (lifeLostTimeout) {
        clearTimeout(lifeLostTimeout);
        lifeLostTimeout = null;
        showLifeLostMessage = false;
    }
    if (invincibleTimeout) {
        clearTimeout(invincibleTimeout);
        invincibleTimeout = null;
        invincible = false;
    }
    startLevel();
}

function gameLoop() {
    if (gameRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!showLifeLostMessage) {
            updateMario();
            updateEnemies();
            updateFlowers();
        }
        drawBackground();
        drawPlatforms();
        drawFlowers();
        drawEnemies();
        drawMario();
        if (level === maxLevel) {
            drawPrincess();
        }
        updateScore();
    }
    requestAnimationFrame(gameLoop);
}

// Start the game
startLevel();
gameLoop(); 