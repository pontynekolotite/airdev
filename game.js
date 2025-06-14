const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

const GROUND_Y = H - 140;
const SKY_Y = Math.floor(H / 2.2);
const GRAVITY = 0.93;
const JUMP_VEL = -19;
const DOUBLE_JUMP_VEL = -15.2;

let gameRunning = false;
let score = 0;
let phraseTimer = 0;
let lastPhrase = "";
let flappyMode = false;
let flappyTimer = 0;
let jumperMode = false;
let jumperTimer = 0;
let debuff = null;
let debuffTimer = 0;
let gameSpeed = 7;
let lives = 3;
let invincible = false;
let invincibleTimer = 0;
let stopTimer = 0; // пауза после урона

let lastObjY = null;
let lastObjType = null;
let lastSpawnFrame = 0;
let frame = 0;

const phrases = [
  "I can fly!",
  "This is for Chicago!",
  "It's slam time!",
  "No one can stop me!",
  "Jumpman, Jumpman, Jumpman!",
  "Too easy!"
];

// Jumpman сбоку, дрибблинг
const jumpman = {
  x: 88,
  y: GROUND_Y,
  vy: 0,
  w: 56,
  h: 66,
  isGround: true,
  canDoubleJump: true,
  dribble: 0
};

// Кроссовок в режиме Red Bull
const sneaker = {
  x: 160,
  y: SKY_Y - 100,
  vy: 0,
  w: 78,
  h: 36,
  wingAngle: 0,
  wingDir: 1
};

const coins = [];
const obstacles = [];

// --------------------------------------------

function resetGame() {
  score = 0;
  jumpman.x = 88;
  jumpman.y = GROUND_Y;
  jumpman.vy = 0;
  jumpman.isGround = true;
  jumpman.canDoubleJump = true;
  phraseTimer = 0;
  lastPhrase = "";
  flappyMode = false;
  flappyTimer = 0;
  jumperMode = false;
  jumperTimer = 0;
  debuff = null;
  debuffTimer = 0;
  coins.length = 0;
  obstacles.length = 0;
  lives = 3;
  invincible = false;
  invincibleTimer = 0;
  stopTimer = 0;
  lastObjY = null;
  lastObjType = null;
  lastSpawnFrame = 0;
  frame = 0;
  document.getElementById("score").style.display = "none";
  document.getElementById("logo").style.display = "block";
  document.getElementById("phrase").textContent = "";
}

// --------------------------------------------

function drawLives() {
  for (let i = 0; i < lives; i++) {
    let x = 26 + i * 40, y = 29;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#fff";
    ctx.fillRect(2, 9, 20, 6);
    ctx.fillStyle = "#222";
    ctx.fillRect(2, 15, 20, 2);
    ctx.fillStyle = "#d42a2a";
    ctx.fillRect(2, 13, 20, 2);
    ctx.fillStyle = "#bbb";
    ctx.fillRect(2, 14, 4, 2);
    ctx.restore();
  }
}

// --------------------------------------------

function drawJumpman() {
  ctx.save();
  ctx.translate(jumpman.x, jumpman.y);
  if (invincible && Math.floor(invincibleTimer / 8) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  // Кроссовок
  ctx.fillStyle = "#fff";
  ctx.fillRect(18, 45, 32, 11);
  ctx.fillStyle = "#222";
  ctx.fillRect(18, 56, 32, 4);
  ctx.fillStyle = "#d42a2a";
  ctx.fillRect(18, 54, 32, 4);
  ctx.fillStyle = "#bbb";
  ctx.fillRect(18, 54, 8, 2);
  // Shorts
  ctx.fillStyle = "#fff";
  ctx.fillRect(18, 26, 22, 18);
  ctx.fillStyle = "#222";
  ctx.fillRect(40, 26, 8, 18);
  // Тело
  ctx.fillStyle = "#d42a2a";
  ctx.fillRect(21, 13, 16, 18);
  // Рука
  ctx.fillStyle = "#eab95c";
  ctx.fillRect(37, 20, 11, 8);
  // Голова
  ctx.beginPath();
  ctx.arc(28, 11, 9, 0, 2 * Math.PI);
  ctx.fillStyle = "#eab95c";
  ctx.fill();
  // Крыло
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.rotate(-0.18);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-13, 27, 18, 8);
  ctx.fillRect(-10, 34, 13, 6);
  ctx.restore();
  // Дрибблинг: мяч
  jumpman.dribble++;
  let ballOffset = 0;
  if (jumpman.isGround) {
    ballOffset = Math.abs(Math.sin(jumpman.dribble * Math.PI / 12)) * 10;
  }
  ctx.beginPath();
  ctx.arc(48, 35 + ballOffset, 10, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffd700";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#aa5a16";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(48, 30 + ballOffset);
  ctx.lineTo(48, 40 + ballOffset);
  ctx.moveTo(43, 35 + ballOffset);
  ctx.lineTo(53, 35 + ballOffset);
  ctx.strokeStyle = "#d17727";
  ctx.stroke();
  ctx.restore();
}

// --------------------------------------------

function drawSneakerWithWings() {
  // Кроссовок
  ctx.save();
  ctx.translate(jumpman.x, jumpman.y);
  // Крылья (анимация)
  let t = frame / 8;
  let angle = Math.sin(t) * 0.33;
  // Левое крыло
  ctx.save();
  ctx.rotate(angle - 0.5);
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.87;
  ctx.fillRect(-45, -10, 32, 16);
  ctx.fillRect(-40, 2, 25, 9);
  ctx.restore();
  // Кроссовок тело
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 6, 78, 17);
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 21, 78, 7);
  ctx.fillStyle = "#d42a2a";
  ctx.fillRect(0, 19, 78, 5);
  ctx.fillStyle = "#bbb";
  ctx.fillRect(0, 20, 14, 3);
  // Полоса
  ctx.fillStyle = "#d42a2a";
  ctx.fillRect(12, 6, 11, 17);
  // Крылья справа (анимация)
  ctx.save();
  ctx.translate(80, 0);
  ctx.rotate(-angle + 0.6);
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.87;
  ctx.fillRect(-8, -11, 30, 15);
  ctx.fillRect(-2, 1, 18, 7);
  ctx.restore();
  ctx.restore();
}

// --------------------------------------------

function spawnCoinOrBuff() {
  // Гарантированный зазор по вертикали и горизонтали
  const r = Math.random();
  let yList = [
    GROUND_Y + 10,
    GROUND_Y - 70,
    SKY_Y + 24,
    SKY_Y - 64,
    SKY_Y - 160
  ];
  // убираем плотные повторы по высоте
  if (lastObjY !== null) {
    yList = yList.filter(yy => Math.abs(yy - lastObjY) > 70);
  }
  let y = yList[Math.floor(Math.random() * yList.length)];
  lastObjY = y;
  // Баффы/дебаффы гарантированно не подряд (3+ объектов подряд не будет)
  let spawnType;
  if (r < 0.12 && lastObjType !== "buff") spawnType = "buff";
  else if (r < 0.19 && lastObjType !== "debuff") spawnType = "debuff";
  else spawnType = "coin";
  lastObjType = spawnType;

  if (spawnType === "buff") {
    const buffs = [
      { type: "redbull", color: "#29b6f6" },
      { type: "jumper", color: "#00c853" }
    ];
    const b = buffs[Math.floor(Math.random() * buffs.length)];
    coins.push({ x: W + 40, y, r: 19, buff: b.type, color: b.color });
  } else if (spawnType === "debuff") {
    const debuffs = [
      { type: "gum", color: "#560D38" },      // липкая жвачка
      { type: "stone", color: "#3b3b3b" },   // камень
      { type: "sad", color: "#2c3e50" }
    ];
    const d = debuffs[Math.floor(Math.random() * debuffs.length)];
    coins.push({ x: W + 40, y, r: 19, debuff: d.type, color: d.color });
  } else {
    coins.push({ x: W + 40, y, r: 13 });
  }
}

// --------------------------------------------

function drawCoins() {
  for (let coin of coins) {
    ctx.save();
    if (coin.buff) {
      ctx.fillStyle = coin.color || "#FFD600";
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText(coin.buff === "redbull" ? "RB" : "BT", coin.x - 16, coin.y + 7);
    } else if (coin.debuff) {
      ctx.fillStyle = coin.color || "#222";
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText("DB", coin.x - 16, coin.y + 7);
    } else {
      // монета
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffd700";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    }
    ctx.restore();
  }
}

// --------------------------------------------

function spawnObstacle() {
  // Меньше препятствий, больше воздуха
  if (Math.random() < 0.7) return; // только 30% шанс спавна!
  let yList = [
    GROUND_Y + 24,
    SKY_Y + 42,
    SKY_Y - 48
  ];
  let y = yList[Math.floor(Math.random() * yList.length)];
  obstacles.push({ x: W + 60, y, w: 44, h: 44, type: "barrier" });
}

function drawObstacles() {
  for (let o of obstacles) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.roundRect(0, 0, 44, 44, 10);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#e74c3c";
    ctx.stroke();
    // значок/иконка внутри
    ctx.font = "bold 22px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("X", 12, 30);
    ctx.restore();
  }
}

// --------------------------------------------

function showPhrase(forced) {
  let text = forced || phrases[Math.floor(Math.random() * phrases.length)];
  if (text === lastPhrase) text = phrases[(phrases.indexOf(text) + 1) % phrases.length];
  document.getElementById("phrase").textContent = text;
  phraseTimer = 60;
  lastPhrase = text;
}

// --------------------------------------------

function gameLoop() {
  frame++;
  ctx.clearRect(0, 0, W, H);

  // Фон
  ctx.fillStyle = "#bdbdbd";
  ctx.fillRect(0, 0, W, H);
  // Граунд
  ctx.fillStyle = "#999";
  ctx.fillRect(0, GROUND_Y + 36, W, H - GROUND_Y - 36);

  drawLives();

  // Облака
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(170, SKY_Y, 58, 0, 2 * Math.PI);
  ctx.arc(410, SKY_Y - 38, 32, 0, 2 * Math.PI);
  ctx.arc(520, SKY_Y + 18, 70, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // Ландшафт — не более 1-2 объектов рядом, много воздуха
  if (frame - lastSpawnFrame > 40 + Math.random() * 20) {
    spawnCoinOrBuff();
    spawnObstacle();
    lastSpawnFrame = frame;
  }

  drawCoins();
  drawObstacles();

  // ----- Спецрежимы и джордан/кроссовок -----
  if (flappyMode) {
    drawSneakerWithWings();
  } else {
    drawJumpman();
  }

  // Движение предметов
  for (let i = coins.length - 1; i >= 0; i--) {
    coins[i].x -= gameSpeed;
    // Сбор
    if (
      Math.abs((flappyMode ? sneaker.x : jumpman.x) + 32 - coins[i].x) < (flappyMode ? 42 : 32) &&
      Math.abs((flappyMode ? sneaker.y : jumpman.y) + 24 - coins[i].y) < (flappyMode ? 36 : 26)
    ) {
      if (coins[i].buff === "redbull") {
        flappyMode = true;
        flappyTimer = 23 * 60;
        jumpman.y = SKY_Y - 100;
        jumpman.vy = 0;
        showPhrase("I can fly!");
      } else if (coins[i].buff === "jumper") {
        jumperMode = true;
        jumperTimer = 12 * 60;
        showPhrase("Jumpman, Jumpman, Jumpman!");
      } else if (coins[i].debuff) {
        debuff = "slow";
        debuffTimer = 5 * 60;
        showPhrase("Slowed down!");
      } else {
        score++;
        showPhrase();
      }
      coins.splice(i, 1);
    } else if (coins[i].x < -40) {
      coins.splice(i, 1);
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= gameSpeed;
    // Коллизия
    if (
      !invincible &&
      Math.abs((flappyMode ? sneaker.x : jumpman.x) + 32 - obstacles[i].x) < 48 &&
      Math.abs((flappyMode ? sneaker.y : jumpman.y) + 24 - obstacles[i].y) < 44
    ) {
      lives--;
      if (lives > 0) {
        invincible = true;
        invincibleTimer = 3 * 60;
        stopTimer = 60;
        showPhrase("Invincible!");
      } else {
        gameRunning = false;
        document.getElementById("startBtn").style.display = "block";
        document.getElementById("score").style.display = "none";
        document.getElementById("logo").style.display = "block";
        showPhrase("GAME OVER");
        return;
      }
    }
    if (obstacles[i].x < -60) obstacles.splice(i, 1);
  }

  // Механики движения — с паузой после урона
  if (stopTimer > 0) {
    stopTimer--;
    if (gameRunning) requestAnimationFrame(gameLoop);
    return;
  }

  // Физика: режим кроссовка (flappyMode)
  if (flappyMode) {
    flappyTimer--;
    jumpman.x = 160;
    jumpman.y += jumpman.vy;
    jumpman.vy += GRAVITY * 0.65;
    if (jumpman.y < 30) jumpman.y = 30;
    if (jumpman.y > H - 80) jumpman.y = H - 80;
    if (flappyTimer <= 0) {
      flappyMode = false;
      jumpman.y = SKY_Y + 14;
      jumpman.vy = 0;
      showPhrase("This is for Chicago!");
    }
    } else if (jumperMode) {
    jumperTimer--;
    jumpman.y += jumpman.vy;
    jumpman.vy += GRAVITY * 0.81;
    if (jumpman.y < SKY_Y - 110) jumpman.y = SKY_Y - 110;
    if (jumpman.y > GROUND_Y) {
      jumpman.y = GROUND_Y;
      jumpman.vy = 0;
      jumpman.isGround = true;
      jumpman.canDoubleJump = true;
    }
    if (jumperTimer <= 0) {
      jumperMode = false;
      showPhrase("Too easy!");
    }
  } else {
    // Обычная физика для раннера
    jumpman.y += jumpman.vy;
    jumpman.vy += GRAVITY;

    // На земле
    if (jumpman.y >= GROUND_Y) {
      jumpman.y = GROUND_Y;
      jumpman.vy = 0;
      jumpman.isGround = true;
      jumpman.canDoubleJump = true;
    }
    // На облаках
    if (jumpman.y < SKY_Y && jumpman.isGround) {
      jumpman.isGround = false;
    }
    if (jumpman.y >= GROUND_Y && !jumpman.isGround) {
      jumpman.isGround = true;
      jumpman.canDoubleJump = true;
    }
  }

  // Дебафф: замедление
  if (debuff) {
    debuffTimer--;
    if (debuff === "slow") gameSpeed = 3.5;
    if (debuffTimer <= 0) {
      debuff = null;
      gameSpeed = 7;
    }
  } else {
    gameSpeed = 7;
  }

  // Неуязвимость
  if (invincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) invincible = false;
  }

  // Счёт
  document.getElementById("score").textContent = "SCORE: " + score;
  document.getElementById("score").style.display = "block";
  document.getElementById("logo").style.display = "none";

  // Фразы
  if (phraseTimer > 0) {
    phraseTimer--;
    if (phraseTimer === 0) {
      document.getElementById("phrase").textContent = "";
    }
  }

  if (gameRunning) requestAnimationFrame(gameLoop);
}

// Управление
document.getElementById("startBtn").onclick = function () {
  this.style.display = "none";
  resetGame();
  gameRunning = true;
  document.getElementById("score").style.display = "block";
  document.getElementById("logo").style.display = "none";
  requestAnimationFrame(gameLoop);
};

window.addEventListener("keydown", function (e) {
  if (!gameRunning) return;
  if (flappyMode) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      jumpman.vy = -13;
    }
    return;
  }
  if (jumperMode) {
    if ((e.code === "Space" || e.code === "ArrowUp") && (jumpman.isGround || jumpman.canDoubleJump)) {
      jumpman.vy = jumpman.isGround ? JUMP_VEL * 1.4 : DOUBLE_JUMP_VEL * 1.33;
      if (!jumpman.isGround) jumpman.canDoubleJump = false;
    }
    return;
  }
  if (e.code === "Space" || e.code === "ArrowUp") {
    if (jumpman.isGround || jumpman.canDoubleJump) {
      jumpman.vy = jumpman.isGround ? JUMP_VEL : DOUBLE_JUMP_VEL;
      if (!jumpman.isGround) jumpman.canDoubleJump = false;
    }
  }
  if (e.code === "ArrowDown") {
    if (!jumpman.isGround && jumpman.y < GROUND_Y) {
      jumpman.y = GROUND_Y;
      jumpman.vy = 2;
      jumpman.isGround = true;
      jumpman.canDoubleJump = true;
    }
  }
});

canvas.addEventListener("touchstart", function () {
  if (!gameRunning) return;
  if (flappyMode) {
    jumpman.vy = -13;
    return;
  }
  if (jumperMode) {
    if (jumpman.isGround || jumpman.canDoubleJump) {
      jumpman.vy = jumpman.isGround ? JUMP_VEL * 1.4 : DOUBLE_JUMP_VEL * 1.33;
      if (!jumpman.isGround) jumpman.canDoubleJump = false;
    }
    return;
  }
  if (jumpman.isGround || jumpman.canDoubleJump) {
    jumpman.vy = jumpman.isGround ? JUMP_VEL : DOUBLE_JUMP_VEL;
    if (!jumpman.isGround) jumpman.canDoubleJump = false;
  }
});
