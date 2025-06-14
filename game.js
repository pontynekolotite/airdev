// === JUMPMAN RETRO GAME ===

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 320;
canvas.height = 480;

const GROUND_Y = 400;
const GRAVITY = 0.6;

// === СОСТОЯНИЯ И ОБЪЕКТЫ ===
let gameStarted = false;
let flappyMode = false;
let jumperMode = false;
let isSpeedBoosted = false;

let flappyTimer = 0;
let jumperTimer = 0;
let speedBoostTimer = 0;
let invincibleTimer = 0;

let score = 0;
let objects = [];

// === JUMPMAN ===
let jumpman = {
  x: 60,
  y: GROUND_Y,
  vy: 0,
  width: 32,
  height: 32,
  lives: 3,
  grounded: true,
  spriteIndex: 0,
  invincible: false
};

// === СПРАЙТЫ ===
const runSprite = new Image();
runSprite.src = "jumpman_run.png";

const airFrames = [new Image(), new Image()];
airFrames[0].src = "jumpman_air_1.png";
airFrames[1].src = "jumpman_air_2.png";
let airFrameIndex = 0;
let airFrameCounter = 0;

const heartImg = new Image();
heartImg.src = "heart.png";

// === ЗВУКИ ===
const dribbleSound = new Audio("dribble.mp3");
let dribbleTimer = 0;

function drawJumpman() {
  if (flappyMode) {
    airFrameCounter++;
    if (airFrameCounter % 8 === 0) airFrameIndex = (airFrameIndex + 1) % 2;
    ctx.drawImage(airFrames[airFrameIndex], jumpman.x, jumpman.y, jumpman.width, jumpman.height);
    if (isSpeedBoosted) drawSpeedTrail();
  } else {
    jumpman.spriteIndex = Math.floor(Date.now() / 100) % 3;
    ctx.drawImage(runSprite, jumpman.spriteIndex * 32, 0, 32, 32, jumpman.x, jumpman.y, 32, 32);
    if (isSpeedBoosted) drawSpeedTrail();

    if (jumpman.grounded && Date.now() - dribbleTimer > 350) {
      dribbleSound.play();
      dribbleTimer = Date.now();
    }
  }
}

function drawLives() {
  for (let i = 0; i < jumpman.lives; i++) {
    ctx.drawImage(heartImg, 10 + i * 36, 10, 24, 24);
  }
}

function drawSpeedTrail() {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(jumpman.x - 10, jumpman.y + 16, 16, 8, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}
// === ОБЪЕКТЫ ===
function spawnObject() {
  const types = ["coin", "boost", "shoes", "magnet", "logo", "debuff", "obstacle"];
  const type = types[Math.floor(Math.random() * types.length)];
  let y = GROUND_Y;

  if (type === "coin") {
    y = Math.random() < 0.5 ? GROUND_Y : 220 + Math.random() * 60;
  } else if (type === "debuff") {
    y = GROUND_Y;
  } else if (type === "obstacle") {
    y = Math.random() < 0.5 ? GROUND_Y : 150 + Math.random() * 100;
  } else if (type === "logo") {
    y = 150;
  }

  objects.push({
    x: canvas.width + 20,
    y: y,
    type: type,
    width: 24,
    height: 24
  });
}

function updateObjects() {
  objects.forEach(obj => {
    obj.x -= isSpeedBoosted ? 6 : 3;

    if (
      jumpman.x < obj.x + obj.width &&
      jumpman.x + jumpman.width > obj.x &&
      jumpman.y < obj.y + obj.height &&
      jumpman.y + jumpman.height > obj.y
    ) {
      handleCollision(obj.type);
      obj.collected = true;
    }
  });

  objects = objects.filter(obj => !obj.collected && obj.x > -50);
}

function handleCollision(type) {
  if (type === "coin") {
    score += 10;
  } else if (type === "boost") {
    isSpeedBoosted = true;
    speedBoostTimer = 600;
    jumpman.invincible = true;
    invincibleTimer = 180;
  } else if (type === "shoes") {
    jumperMode = true;
    jumperTimer = 600;
  } else if (type === "magnet") {
    magnetMode = true;
    magnetTimer = 600;
  } else if (type === "logo") {
    flappyMode = true;
    flappyTimer = 900;
    jumpman.invincible = true;
    invincibleTimer = 180;
  } else if (type === "debuff") {
    if (!jumpman.invincible) {
      jumpman.lives--;
      jumpman.invincible = true;
      invincibleTimer = 180;
    }
  } else if (type === "obstacle") {
    if (!jumpman.invincible) {
      jumpman.lives--;
      jumpman.invincible = true;
      invincibleTimer = 180;
    }
  }
}
