// === JUMPMAN RETRO GAME ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 320;
canvas.height = 480;

const startMenu = document.getElementById("startMenu");
const GROUND_Y = 400;
const GRAVITY = 0.6;

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

let jumpman = {
  x: 60,
  y: GROUND_Y,
  vy: 0,
  width: 32,
  height: 32,
  lives: 3,
  grounded: true,
  invincible: false,
  spriteIndex: 0
};

const runSprite = new Image();
runSprite.src = "jumpman_sprites.png";

const airFrames = [new Image(), new Image()];
airFrames[0].src = "jumpman_air_frame_1.png";
airFrames[1].src = "jumpman_air_frame_2.png";
let airFrameIndex = 0, airFrameCounter = 0;

const heartImg = new Image();
heartImg.src = "heart.png";

const dribbleSound = new Audio("dribble.mp3");
let dribbleTimer = 0;

function drawJumpman() {
  if (flappyMode) {
    airFrameCounter++;
    if (airFrameCounter % 8 === 0) airFrameIndex = (airFrameIndex + 1) % 2;
    ctx.drawImage(airFrames[airFrameIndex], jumpman.x, jumpman.y, 32, 32);
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

function drawSpeedTrail() {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(jumpman.x - 10, jumpman.y + 16, 16, 8, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawLives() {
  for (let i = 0; i < jumpman.lives; i++) {
    ctx.drawImage(heartImg, 10 + i * 36, 10, 24, 24);
  }
}
// === JUMPMAN RETRO: GAME LOOP ===

function loop() {
  if (gameStarted) {
    update();
    draw();
  }
  requestAnimationFrame(loop);
}

loop();
