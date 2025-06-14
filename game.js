const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.9;
const GROUND_Y = 520;
const SKY_Y = 240;
const JUMP_VEL = -16;
const DOUBLE_JUMP_VEL = -15;

let gameRunning = false;
let score = 0;
let phraseTimer = 0;
let lastPhrase = "";

const phrases = [
  "I can fly!",
  "This is for Chicago!",
  "It's slam time!",
  "No one can stop me!",
  "Jumpman, Jumpman, Jumpman!",
  "Too easy!"
];

// Jumpman — минимальный спрайт
const jumpman = {
  x: 60,
  y: GROUND_Y,
  vy: 0,
  w: 36,
  h: 38,
  isGround: true,
  canDoubleJump: true,
  spriteStep: 0
};

const coins = [];
const obstacles = [];

function resetGame() {
  score = 0;
  jumpman.x = 60;
  jumpman.y = GROUND_Y;
  jumpman.vy = 0;
  jumpman.isGround = true;
  jumpman.canDoubleJump = true;
  phraseTimer = 0;
  lastPhrase = "";
  coins.length = 0;
  obstacles.length = 0;
}

function drawJumpman() {
  // 8-bit body
  ctx.save();
  ctx.translate(jumpman.x, jumpman.y);

  // Legs
  ctx.fillStyle = "#222";
  ctx.fillRect(8, 32, 8, 6);
  ctx.fillRect(20, 32, 8, 6);
  // Shoes
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(8, 38, 8, 4);
  ctx.fillRect(20, 38, 8, 4);
  // Shorts
  ctx.fillStyle = "#fff";
  ctx.fillRect(10, 22, 16, 12);
  // Body
  ctx.fillStyle = "#222";
  ctx.fillRect(12, 6, 12, 20);
  // Ball
  ctx.beginPath();
  ctx.arc(33, 18, 6, 0, 2 * Math.PI);
  ctx.fillStyle = "#e67e22";
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(18, 10, 7, 0, 2 * Math.PI);
  ctx.fillStyle = "#333";
  ctx.fill();
  // Wings (8bit "крыло" сбоку)
  ctx.fillStyle = "#fff";
  ctx.fillRect(-2, 12, 10, 4);
  ctx.fillRect(-4, 14, 8, 4);

  ctx.restore();
}

function spawnCoin() {
  coins.push({
    x: canvas.width + 30,
    y: Math.random() < 0.5 ? GROUND_Y + 8 : SKY_Y + 18,
    r: 9
  });
}

function drawCoins() {
  for (let coin of coins) {
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fffb";
    ctx.stroke();
  }
}

function spawnObstacle() {
  const isGround = Math.random() < 0.7;
  obstacles.push({
    x: canvas.width + 38,
    y: isGround ? GROUND_Y + 14 : SKY_Y + 22,
    w: 32,
    h: isGround ? 32 : 40,
    type: isGround ? "player" : "hoop"
  });
}

function drawObstacles() {
  for (let o of obstacles) {
    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.type === "player") {
      // другой игрок
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, o.w, o.h);
      ctx.fillStyle = "#fff";
      ctx.fillRect(4, 20, 24, 10);
    } else {
      // баскетбольное кольцо
      ctx.beginPath();
      ctx.arc(16, 10, 14, 0, 2 * Math.PI);
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(16, 12, 10, 0, Math.PI, false);
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    }
    ctx.restore();
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Фон — серый, облака
  ctx.fillStyle = "#bdbdbd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Граунд
  ctx.fillStyle = "#989898";
  ctx.fillRect(0, GROUND_Y + 32, canvas.width, 48);
  // Облака
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(70, SKY_Y, 30, 0, 2 * Math.PI);
  ctx.arc(160, SKY_Y - 10, 18, 0, 2 * Math.PI);
  ctx.arc(310, SKY_Y + 6, 36, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Джордан
  drawJumpman();
  drawCoins();
  drawObstacles();

  // Обработка монет
  for (let i = coins.length - 1; i >= 0; i--) {
    coins[i].x -= 6;
    // Коллизия
    if (
      Math.abs(jumpman.x + 16 - coins[i].x) < 22 &&
      Math.abs(jumpman.y + 20 - coins[i].y) < 24
    ) {
      score++;
      showPhrase();
      coins.splice(i, 1);
    } else if (coins[i].x < -20) {
      coins.splice(i, 1);
    }
  }
  // Обработка препятствий
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= 7;
    if (
      Math.abs(jumpman.x + 16 - obstacles[i].x) < 28 &&
      Math.abs(jumpman.y + 20 - obstacles[i].y) < 32
    ) {
      // GAME OVER
      gameRunning = false;
      document.getElementById("startBtn").style.display = "block";
      showPhrase("GAME OVER");
      return;
    }
    if (obstacles[i].x < -40) {
      obstacles.splice(i, 1);
    }
  }

  // Физика
  jumpman.y += jumpman.vy;
  jumpman.vy += GRAVITY;

  // Плоскости
  const groundY = jumpman.isGround ? GROUND_Y : SKY_Y;
  if (jumpman.y >= groundY) {
    jumpman.y = groundY;
    jumpman.vy = 0;
    jumpman.canDoubleJump = true;
  }

  // Переход на верхний уровень
  if (jumpman.y < SKY_Y && jumpman.isGround) {
    jumpman.isGround = false;
  }
  if (jumpman.y >= GROUND_Y && !jumpman.isGround) {
    jumpman.isGround = true;
  }

  // Спавн бонусов и препятствий
  if (Math.random() < 0.014) spawnCoin();
  if (Math.random() < 0.022) spawnObstacle();

  // UI
  document.getElementById("score").textContent = "SCORE: " + score;

  // Фразы
  if (phraseTimer > 0) {
    phraseTimer--;
    if (phraseTimer === 0) {
      document.getElementById("phrase").textContent = "";
    }
  }

  if (gameRunning) requestAnimationFrame(gameLoop);
}

function showPhrase(forced) {
  let text = forced || phrases[Math.floor(Math.random() * phrases.length)];
  if (text === lastPhrase) text = phrases[(phrases.indexOf(text) + 1) % phrases.length];
  document.getElementById("phrase").textContent = text;
  phraseTimer = 60;
  lastPhrase = text;
}

// Управление
document.getElementById("startBtn").onclick = function () {
  this.style.display = "none";
  resetGame();
  gameRunning = true;
  requestAnimationFrame(gameLoop);
};
window.addEventListener("keydown", function (e) {
  if (!gameRunning) return;
  if (e.code === "Space" || e.code === "ArrowUp") {
    if (jumpman.vy > -3 && jumpman.canDoubleJump) {
      jumpman.vy = jumpman.isGround ? JUMP_VEL : DOUBLE_JUMP_VEL;
      if (!jumpman.isGround) jumpman.canDoubleJump = false;
    }
  }
  if (e.code === "ArrowDown") {
    // Переход между плоскостями (если в прыжке — вниз на землю)
    if (!jumpman.isGround && jumpman.y < GROUND_Y) {
      jumpman.y = GROUND_Y;
      jumpman.vy = 2;
      jumpman.isGround = true;
    }
  }
});

canvas.addEventListener("touchstart", function (e) {
  if (!gameRunning) return;
  if (jumpman.vy > -3 && jumpman.canDoubleJump) {
    jumpman.vy = jumpman.isGround ? JUMP_VEL : DOUBLE_JUMP_VEL;
    if (!jumpman.isGround) jumpman.canDoubleJump = false;
  }
});
