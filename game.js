const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");

const ROWS = 5;
const COLS = 10;
const ALIEN_W = 30;
const ALIEN_H = 20;
const GAP_X = 16;
const GAP_Y = 14;
const ROW_POINTS = [30, 20, 20, 10, 10];
const ROW_COLORS = ["#ff4c8b", "#ffd84c", "#ffd84c", "#4cc9ff", "#4cc9ff"];

const keys = {};
let state = "start"; // start | playing | paused | over
let player, bullets, enemyBullets, aliens, shields, popups;
let alienDir, alienSpeed, alienShootChance, score, level, lives, lastTime, frame, marchTimer;

function newGame() {
  score = 0;
  level = 1;
  lives = 3;
  setupLevel();
  state = "playing";
  Sound.say(Words.levelIntro(level), { interrupt: true });
}

function setupLevel() {
  player = { x: W / 2 - 20, y: H - 40, w: 40, h: 16, speed: 300, cooldown: 0, flash: 0 };
  bullets = [];
  enemyBullets = [];
  popups = [];
  aliens = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      aliens.push({
        x: 60 + c * (ALIEN_W + GAP_X),
        y: 50 + r * (ALIEN_H + GAP_Y),
        w: ALIEN_W,
        h: ALIEN_H,
        row: r,
      });
    }
  }
  shields = [];
  for (let i = 0; i < 4; i++) {
    const baseX = 70 + i * 145;
    for (let bx = 0; bx < 10; bx++) {
      for (let by = 0; by < 5; by++) {
        if (by === 4 && bx > 2 && bx < 7) continue; // notch at bottom
        shields.push({ x: baseX + bx * 6, y: H - 110 + by * 6, w: 6, h: 6 });
      }
    }
  }
  alienDir = 1;
  alienSpeed = 30 + level * 10;
  alienShootChance = 0.6 + level * 0.2; // shots per second across the swarm
  marchTimer = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  livesEl.textContent = lives;
}

function hit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function hitShield(b) {
  const i = shields.findIndex((s) => hit(b, s));
  if (i !== -1) {
    shields.splice(i, 1);
    return true;
  }
  return false;
}

function update(dt) {
  // Player movement
  if (keys["ArrowLeft"] || keys["KeyA"]) player.x -= player.speed * dt;
  if (keys["ArrowRight"] || keys["KeyD"]) player.x += player.speed * dt;
  player.x = Math.max(0, Math.min(W - player.w, player.x));

  // Player shooting
  player.cooldown -= dt;
  if (player.flash > 0) player.flash -= dt;
  if (keys["Space"] && player.cooldown <= 0 && bullets.length < 2) {
    bullets.push({ x: player.x + player.w / 2 - 2, y: player.y - 10, w: 4, h: 10 });
    player.cooldown = 0.35;
    Sound.shoot();
  }

  // Player bullets
  for (const b of bullets) b.y -= 500 * dt;
  bullets = bullets.filter((b) => {
    if (b.y + b.h < 0 || hitShield(b)) return false;
    const i = aliens.findIndex((a) => hit(b, a));
    if (i !== -1) {
      const a = aliens[i];
      score += ROW_POINTS[a.row];
      aliens.splice(i, 1);
      Sound.alienHit();
      // Cheer now and then, not on every hit
      if (Math.random() < 0.25) {
        const word = Words.shout("alien");
        popups.push({ text: word, x: a.x + a.w / 2, y: a.y, life: 1.2 });
        Sound.say(word);
      }
      updateHud();
      return false;
    }
    return true;
  });

  // Floating words drift up and fade
  for (const p of popups) {
    p.y -= 40 * dt;
    p.life -= dt;
  }
  popups = popups.filter((p) => p.life > 0);

  // Alien movement: speed up as the swarm shrinks
  const speed = alienSpeed * (1 + (ROWS * COLS - aliens.length) / 15);
  let edge = false;
  for (const a of aliens) {
    a.x += alienDir * speed * dt;
    if (a.x < 10 || a.x + a.w > W - 10) edge = true;
  }
  if (edge) {
    alienDir *= -1;
    for (const a of aliens) {
      a.x += alienDir * speed * dt;
      a.y += 16;
    }
  }

  // March beat: tempo follows swarm speed
  marchTimer -= dt;
  if (marchTimer <= 0 && aliens.length) {
    Sound.march();
    marchTimer = Math.max(0.12, 32 / speed);
  }

  // Alien shooting: only the bottom alien in each column fires
  if (aliens.length && Math.random() < alienShootChance * dt) {
    const shooters = {};
    for (const a of aliens) {
      const key = Math.round((a.x - aliens[0].x) / (ALIEN_W + GAP_X));
      if (!shooters[key] || a.y > shooters[key].y) shooters[key] = a;
    }
    const list = Object.values(shooters);
    const s = list[Math.floor(Math.random() * list.length)];
    enemyBullets.push({ x: s.x + s.w / 2 - 2, y: s.y + s.h, w: 4, h: 10 });
  }

  // Enemy bullets
  for (const b of enemyBullets) b.y += (200 + level * 20) * dt;
  enemyBullets = enemyBullets.filter((b) => {
    if (b.y > H || hitShield(b)) return false;
    if (hit(b, player)) {
      loseLife();
      return false;
    }
    return true;
  });

  // Aliens erode shields and can reach the player
  for (const a of aliens) {
    shields = shields.filter((s) => !hit(a, s));
    if (a.y + a.h >= player.y) {
      lives = 0;
      updateHud();
      state = "over";
      Sound.gameOver();
      Sound.say(Words.shout("over"), { interrupt: true });
      return;
    }
  }

  // Level cleared
  if (aliens.length === 0) {
    level++;
    Sound.levelUp();
    setupLevel();
    Sound.say(`${Words.shout("cleared")} ${Words.levelIntro(level)}`, { interrupt: true });
  }
}

function loseLife() {
  lives--;
  player.flash = 1;
  enemyBullets = [];
  updateHud();
  if (lives <= 0) {
    state = "over";
    Sound.gameOver();
    Sound.say(Words.shout("over"), { interrupt: true });
  } else {
    Sound.playerHit();
    Sound.say(Words.shout("hit"), { interrupt: true });
  }
}

function drawAlien(a) {
  ctx.fillStyle = ROW_COLORS[a.row];
  const open = Math.floor(frame / 30) % 2 === 0;
  const { x, y, w, h } = a;
  ctx.fillRect(x + 6, y, w - 12, h - 6); // body
  ctx.fillRect(x, y + 6, w, 6); // arms
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 9, y + 4, 4, 4); // eyes
  ctx.fillRect(x + w - 13, y + 4, 4, 4);
  ctx.fillStyle = ROW_COLORS[a.row];
  // legs alternate between two poses
  if (open) {
    ctx.fillRect(x + 2, y + h - 6, 4, 6);
    ctx.fillRect(x + w - 6, y + h - 6, 4, 6);
  } else {
    ctx.fillRect(x + 8, y + h - 6, 4, 6);
    ctx.fillRect(x + w - 12, y + h - 6, 4, 6);
  }
}

function drawPlayer() {
  if (player.flash > 0 && Math.floor(player.flash * 10) % 2 === 0) return;
  ctx.fillStyle = "#4cff6a";
  const { x, y, w, h } = player;
  ctx.fillRect(x, y + 6, w, h - 6);
  ctx.fillRect(x + w / 2 - 4, y, 8, 8);
}

function drawText(lines) {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  lines.forEach(([text, size], i) => {
    ctx.font = `${size}px "Courier New", monospace`;
    ctx.fillText(text, W / 2, H / 2 - 30 + i * 40);
  });
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  if (state !== "start") {
    ctx.fillStyle = "#4cff6a";
    for (const s of shields) ctx.fillRect(s.x, s.y, s.w, s.h);
    aliens.forEach(drawAlien);
    drawPlayer();
    ctx.fillStyle = "#fff";
    for (const b of bullets) ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "#ff6b4c";
    for (const b of enemyBullets) ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "#4cff6a";
    ctx.fillRect(0, H - 14, W, 2);
    ctx.textAlign = "center";
    ctx.font = 'bold 28px "Courier New", monospace';
    for (const p of popups) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, p.life)})`;
      ctx.fillText(p.text, p.x, p.y);
    }
  }

  if (state === "start") drawText([["SPACE INVADERS", 40], ["Press Enter or tap to start", 20]]);
  if (state === "paused") drawText([["PAUSED", 36], ["Press P or tap to resume", 20]]);
  if (state === "over") drawText([["GAME OVER", 40], [`Score: ${score}`, 22], ["Press Enter or tap to play again", 20]]);
}

function loop(time) {
  const dt = Math.min((time - (lastTime || time)) / 1000, 0.05);
  lastTime = time;
  frame++;
  if (state === "playing") update(dt);
  draw();
  requestAnimationFrame(loop);
}

const muteBtn = document.getElementById("mute-btn");

function togglePause() {
  Sound.stopSpeech();
  if (state === "playing") state = "paused";
  else if (state === "paused") state = "playing";
}

function toggleMute() {
  muteBtn.textContent = Sound.toggleMute() ? "Unmute" : "Mute";
}

// Keyboard
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  Sound.init();
  if (e.code === "KeyM") toggleMute();
  if (["Space", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  if (e.code === "Enter" && (state === "start" || state === "over")) newGame();
  if (e.code === "KeyP") togglePause();
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Touch: on-screen buttons act like held keys
for (const btn of document.querySelectorAll("[data-key]")) {
  const key = btn.dataset.key;
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    Sound.init();
    keys[key] = true;
    btn.classList.add("active");
  });
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
    btn.addEventListener(type, () => {
      keys[key] = false;
      btn.classList.remove("active");
    });
  }
}

// Tap the game to start, restart or resume
canvas.addEventListener("pointerdown", () => {
  Sound.init();
  if (state === "start" || state === "over") newGame();
  else if (state === "paused") state = "playing";
});

document.getElementById("pause-btn").addEventListener("click", togglePause);
muteBtn.addEventListener("click", toggleMute);

// iOS only unlocks audio on certain gestures, so try on these too
document.addEventListener("touchend", Sound.init);
document.addEventListener("click", Sound.init);

// Auto-pause when the app is switched away from
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "playing") {
    state = "paused";
    Sound.stopSpeech();
  }
});

// Offline support (service workers don't run from file://)
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js");
}

frame = 0;
requestAnimationFrame(loop);
