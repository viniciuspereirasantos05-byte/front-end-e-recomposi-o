// =========================================
//  JOGO QUE UM ADOLESCENTE FARIA
// =========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ====== ESTADO ======
let player, bullets, enemies, enemyBullets, particles;
let score = 0;
let lives = 3;
let progress = 0;
let bossSpawned = false;
let hordeMode = false;
let gameOver = false;
let victory = false;
let waveTimer = 0;
let spawnInterval = 1200;
let areaCooldown = 0;
let lastTime = 0;
let running = false;

const AREA_COOLDOWN_MAX = 4000;

// ====== ÁUDIO ======
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audio = new AudioCtx();

function playTone(freq, duration, type = 'square', volume = 0.05, sweepTo = null) {
  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, audio.currentTime + duration);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch (e) {}
}

const SFX = {
  shoot:      function(){ playTone(800, 0.06, 'square', 0.03, 400); },
  area:       function(){ playTone(200, 0.5, 'sawtooth', 0.15, 40); },
  hit:        function(){ playTone(300, 0.1, 'triangle', 0.06, 100); },
  playerHurt: function(){ playTone(120, 0.3, 'sawtooth', 0.15, 50); },
  enemyDie:   function(){ playTone(500, 0.15, 'square', 0.05, 150); },
  bossSpawn:  function(){ playTone(80, 1.2, 'sawtooth', 0.2, 30); },
  victory:    function(){
    playTone(523, 0.15, 'square', 0.1);
    setTimeout(function(){ playTone(659, 0.15, 'square', 0.1); }, 150);
    setTimeout(function(){ playTone(784, 0.3, 'square', 0.1); }, 300);
  }
};

// ====== TROCA DE TELA ======
const menuScreen = document.getElementById('menu-screen');
const gameWrapper = document.getElementById('game-wrapper');

document.getElementById('play-btn').addEventListener('click', function(){
  if (audio.state === 'suspended') audio.resume();
  menuScreen.classList.add('hidden');
  gameWrapper.classList.remove('hidden');
  initGame();
});

function voltarMenu() {
  running = false;
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('victory-screen').classList.add('hidden');
  gameWrapper.classList.add('hidden');
  menuScreen.classList.remove('hidden');
}
window.voltarMenu = voltarMenu;

document.getElementById('restart-btn').addEventListener('click', function(){
  document.getElementById('gameover-screen').classList.add('hidden');
  initGame();
});
document.getElementById('restart-btn-2').addEventListener('click', function(){
  document.getElementById('victory-screen').classList.add('hidden');
  initGame();
});

// ====== INPUT ======
const keys = {};
document.addEventListener('keydown', function(e){
  keys[e.key.toLowerCase()] = true;
  if (e.code === 'Space') { keys[' '] = true; e.preventDefault(); }
});
document.addEventListener('keyup', function(e){
  keys[e.key.toLowerCase()] = false;
  if (e.code === 'Space') keys[' '] = false;
});

// ====== ESTRELAS ======
const stars = [];
for (let i = 0; i < 200; i++) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 1.8 + 0.3,
    speed: Math.random() * 0.5 + 0.1
  });
}

// ====== PLAYER ======
function createPlayer() {
  return {
    x: W / 2,
    y: H - 80,
    w: 34,
    h: 34,
    speed: 4.5,
    invuln: 0,
    fireRate: 220,
    lastFire: 0,
    bulletDamage: 1,
    areaDamage: 8,
    areaRadius: 180
  };
}

// ====== SPAWN ======
function spawnEnemy() {
  const isTank = Math.random() < 0.15;
  if (isTank) {
    enemies.push({
      type: 'tank',
      x: Math.random() * (W - 60) + 30,
      y: -60,
      w: 60, h: 60,
      hp: 25, maxHp: 25,
      speed: 0.8,
      color: '#4a1e8c',
      score: 50,
      contact: 1
    });
  } else {
    enemies.push({
      type: 'normal',
      x: Math.random() * (W - 30) + 15,
      y: -30,
      w: 26, h: 26,
      hp: 2, maxHp: 2,
      speed: 1.6 + Math.random() * 0.8,
      color: '#9d4aff',
      score: 10,
      contact: 1
    });
  }
}

function spawnHorde() {
  for (let i = 0; i < 8; i++) {
    (function(i){
      setTimeout(function(){
        if (gameOver || victory || !running) return;
        enemies.push({
          type: 'normal',
          x: Math.random() * (W - 30) + 15,
          y: -30,
          w: 26, h: 26,
          hp: 2, maxHp: 2,
          speed: 2.5 + Math.random() * 1.2,
          color: '#9d4aff',
          score: 10,
          contact: 1
        });
      }, i * 80);
    })(i);
  }
  const tanks = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < tanks; i++) {
    (function(i){
      setTimeout(function(){
        if (gameOver || victory || !running) return;
        enemies.push({
          type: 'tank',
          x: Math.random() * (W - 60) + 30,
          y: -60,
          w: 60, h: 60,
          hp: 25, maxHp: 25,
          speed: 1.0,
          color: '#4a1e8c',
          score: 50,
          contact: 1
        });
      }, i * 400);
    })(i);
  }
}

function spawnBoss() {
  bossSpawned = true;
  SFX.bossSpawn();
  enemies.push({
    type: 'boss',
    x: W / 2,
    y: -150,
    w: 180, h: 180,
    hp: 500, maxHp: 500,
    score: 1000,
    contact: 3,
    phase: 'entering',
    shootTimer: 0,
    time: 0
  });
}

// ====== TIROS ======
function shoot() {
  bullets.push({
    x: player.x,
    y: player.y - player.h / 2,
    vx: 0,
    vy: -9,
    r: 4,
    damage: player.bulletDamage
  });
  SFX.shoot();
}

function areaBlast() {
  if (areaCooldown > 0) return;
  areaCooldown = AREA_COOLDOWN_MAX;
  SFX.area();
  enemies.forEach(function(e){
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.areaRadius + e.w / 2) {
      e.hp -= player.areaDamage;
      if (e.hp <= 0 && e.type !== 'boss') killEnemy(e);
    }
  });
  for (let i = 0; i < 40; i++) {
    const a = (Math.PI * 2 * i) / 40;
    particles.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * 6,
      vy: Math.sin(a) * 6,
      life: 30, maxLife: 30,
      color: '#ff3cc8', size: 4
    });
  }
}

function killEnemy(e) {
  SFX.enemyDie();
  score += e.score;
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: e.x, y: e.y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 25, maxLife: 25,
      color: e.color, size: 3
    });
  }
  e.dead = true;
}

// ====== UPDATE ======
function update(dt) {
  stars.forEach(function(s){
    s.y += s.speed * (1 + progress / 100);
    if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
  });

  if (gameOver || victory) return;

  if (keys['w'] || keys['arrowup'])    player.y -= player.speed;
  if (keys['s'] || keys['arrowdown'])  player.y += player.speed;
  if (keys['a'] || keys['arrowleft'])  player.x -= player.speed;
  if (keys['d'] || keys['arrowright']) player.x += player.speed;

  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(H - player.h / 2, player.y));

  if (performance.now() - player.lastFire > player.fireRate) {
    shoot();
    player.lastFire = performance.now();
  }

  if (keys[' ']) areaBlast();
  if (areaCooldown > 0) areaCooldown = Math.max(0, areaCooldown - dt);
  if (player.invuln > 0) player.invuln -= dt;

  bullets.forEach(function(b){ b.x += b.vx; b.y += b.vy; });
  bullets = bullets.filter(function(b){ return b.y > -20 && b.y < H + 20; });

  if (!bossSpawned && !gameOver) {
    waveTimer += dt;
    if (waveTimer > spawnInterval) {
      waveTimer = 0;
      if (hordeMode) spawnHorde();
      else spawnEnemy();
    }
  }

  enemies.forEach(function(e){
    if (e.type === 'boss') {
      e.time += dt;
      if (e.phase === 'entering') {
        e.y += 1.2;
        if (e.y >= 140) e.phase = 'fight';
      } else if (e.phase === 'fight') {
        e.x = W / 2 + Math.sin(e.time / 900) * 220;
        e.y = 140 + Math.sin(e.time / 600) * 30;
        e.shootTimer += dt;
        if (e.shootTimer > 1400) {
          e.shootTimer = 0;
          for (let i = -3; i <= 3; i++) {
            const ang = Math.PI / 2 + i * 0.18;
            enemyBullets.push({
              x: e.x, y: e.y + e.h / 2,
              vx: Math.cos(ang) * 3.5,
              vy: Math.sin(ang) * 3.5,
              r: 6
            });
          }
          playTone(150, 0.2, 'sawtooth', 0.06, 80);
        }
      }
    } else {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.x += (dx / d) * e.speed;
      e.y += (dy / d) * e.speed;
    }

    if (player.invuln <= 0 &&
        Math.abs(e.x - player.x) < (e.w / 2 + player.w / 2) * 0.8 &&
        Math.abs(e.y - player.y) < (e.h / 2 + player.h / 2) * 0.8) {
      lives -= e.contact;
      player.invuln = 1200;
      SFX.playerHurt();
      if (lives <= 0) endGame(false);
      if (e.type !== 'boss') killEnemy(e);
    }
  });

  bullets.forEach(function(b){
    enemies.forEach(function(e){
      if (e.dead) return;
      if (Math.abs(b.x - e.x) < e.w / 2 && Math.abs(b.y - e.y) < e.h / 2) {
        e.hp -= b.damage;
        b.dead = true;
        SFX.hit();
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: b.x, y: b.y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 15, maxLife: 15,
            color: '#ff9df0', size: 2
          });
        }
        if (e.hp <= 0) {
          if (e.type === 'boss') {
            killEnemy(e);
            endGame(true);
          } else {
            killEnemy(e);
          }
        }
      }
    });
  });
  bullets = bullets.filter(function(b){ return !b.dead; });
  enemies = enemies.filter(function(e){ return !e.dead; });

  enemyBullets.forEach(function(b){
    b.x += b.vx;
    b.y += b.vy;
    if (player.invuln <= 0 &&
        Math.abs(b.x - player.x) < player.w / 2 &&
        Math.abs(b.y - player.y) < player.h / 2) {
      lives--;
      player.invuln = 1200;
      SFX.playerHurt();
      b.dead = true;
      if (lives <= 0) endGame(false);
    }
  });
  enemyBullets = enemyBullets.filter(function(b){
    return !b.dead && b.y < H + 20 && b.x > -20 && b.x < W + 20;
  });

  particles.forEach(function(p){
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.95; p.vy *= 0.95;
    p.life--;
  });
  particles = particles.filter(function(p){ return p.life > 0; });

  if (!bossSpawned) {
    progress += dt * 0.012;
    if (progress >= 100) progress = 100;
    if (progress >= 70) hordeMode = true;
    if (progress >= 100) spawnBoss();
  }

  updateHUD();
}

// ====== DESENHO ======
function drawShip(x, y) {
  ctx.save();
  ctx.translate(x, y);

  const flame = Math.sin(performance.now() / 60) * 3;
  ctx.fillStyle = '#ff9500';
  ctx.beginPath();
  ctx.moveTo(-6, 16); ctx.lineTo(0, 22 + flame); ctx.lineTo(6, 16);
  ctx.fill();
  ctx.fillStyle = '#ffdd00';
  ctx.beginPath();
  ctx.moveTo(-3, 16); ctx.lineTo(0, 19 + flame * 0.6); ctx.lineTo(3, 16);
  ctx.fill();

  const blink = player.invuln > 0 && Math.floor(performance.now() / 100) % 2 === 0;
  ctx.fillStyle = blink ? '#ffffff' : '#4ad4ff';
  ctx.beginPath();
  ctx.moveTo(0, -18); ctx.lineTo(12, 10); ctx.lineTo(0, 6); ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1e3a8c';
  ctx.beginPath();
  ctx.moveTo(0, -10); ctx.lineTo(5, 5); ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawNormalEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.moveTo(0, 12); ctx.lineTo(12, -10); ctx.lineTo(-12, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e0a3ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawTankEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);

  ctx.fillStyle = '#3a0a6a';
  ctx.beginPath(); ctx.ellipse(-24, 0, 12, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(24, 0, 12, 20, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(0, 0, 20, 24, 0, 0, Math.PI * 2); ctx.fill();

  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  ctx.fillStyle = '#9d4aff';
  ctx.beginPath();
  ctx.arc(Math.cos(angle) * 6, Math.sin(angle) * 6, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(Math.cos(angle) * 9, Math.sin(angle) * 9, 5, 0, Math.PI * 2);
  ctx.fill();

  drawHPBar(e, 30, -36);
  ctx.restore();
}

function drawBoss(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const pulse = Math.sin(performance.now() / 200) * 5;

  ctx.fillStyle = 'rgba(106, 60, 255, 0.2)';
  ctx.beginPath(); ctx.arc(0, 0, 110 + pulse, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#1a0033';
  ctx.beginPath();
  ctx.moveTo(-40, -20);
  ctx.quadraticCurveTo(-130, -60, -150, 30);
  ctx.quadraticCurveTo(-100, 20, -60, 40);
  ctx.closePath(); ctx.fill();

  ctx.beginPath();
  ctx.moveTo(40, -20);
  ctx.quadraticCurveTo(130, -60, 150, 30);
  ctx.quadraticCurveTo(100, 20, 60, 40);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#6a3cff';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const baseX = -60 + i * 30;
    const wob = Math.sin(performance.now() / 300 + i) * 15;
    ctx.beginPath();
    ctx.moveTo(baseX, 60);
    ctx.quadraticCurveTo(baseX + wob, 100, baseX + wob * 1.5, 130);
    ctx.stroke();
  }

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill();

  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  ctx.fillStyle = '#6a3cff';
  ctx.beginPath();
  ctx.arc(Math.cos(angle) * 15, Math.sin(angle) * 15, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(Math.cos(angle) * 25, Math.sin(angle) * 25, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(-8 + Math.cos(angle) * 10, -8 + Math.sin(angle) * 10, 6, 0, Math.PI * 2);
  ctx.fill();

  const hpPct = e.hp / e.maxHp;
  ctx.fillStyle = '#333'; ctx.fillRect(-100, -110, 200, 14);
  ctx.fillStyle = '#ff3cc8'; ctx.fillRect(-100, -110, 200 * hpPct, 14);
  ctx.strokeStyle = '#fff'; ctx.strokeRect(-100, -110, 200, 14);

  ctx.restore();
}

function drawHPBar(e, w, y) {
  const pct = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = '#000'; ctx.fillRect(-w / 2, y, w, 4);
  ctx.fillStyle = '#ff3c3c'; ctx.fillRect(-w / 2, y, w * pct, 4);
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  stars.forEach(function(s){
    ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + s.size / 3) + ')';
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  bullets.forEach(function(b){
    ctx.fillStyle = '#ffff66';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ffff00';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });

  enemyBullets.forEach(function(b){
    ctx.fillStyle = '#ff3cc8';
    ctx.shadowBlur = 12; ctx.shadowColor = '#ff3cc8';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });

  enemies.forEach(function(e){
    if (e.type === 'normal') drawNormalEnemy(e);
    else if (e.type === 'tank') drawTankEnemy(e);
    else if (e.type === 'boss') drawBoss(e);
  });

  particles.forEach(function(p){
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (player && lives > 0 && !gameOver) drawShip(player.x, player.y);
}

// ====== HUD ======
function updateHUD() {
  document.getElementById('lives').textContent = '💚'.repeat(Math.max(0, lives));
  document.getElementById('progress-bar').style.width = progress + '%';
  document.getElementById('progress-text').textContent = Math.floor(progress) + '%';
  document.getElementById('score').textContent = 'Pontos: ' + score;

  const cdText = document.getElementById('cd-text');
  if (areaCooldown > 0) {
    cdText.textContent = (areaCooldown / 1000).toFixed(1) + 's';
  } else {
    cdText.textContent = 'Pronto';
  }
}

// ====== FIM DE JOGO ======
function endGame(won) {
  if (gameOver || victory) return;
  if (won) {
    victory = true;
    SFX.victory();
    document.getElementById('victory-score').textContent = 'Pontuação: ' + score;
    document.getElementById('victory-screen').classList.remove('hidden');
  } else {
    gameOver = true;
    document.getElementById('final-score').textContent = 'Pontuação: ' + score;
    document.getElementById('gameover-screen').classList.remove('hidden');
  }
}

// ====== LOOP ======
function gameLoop(timestamp) {
  if (!running) return;
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// ====== INICIALIZAÇÃO ======
function initGame() {
  player = createPlayer();
  bullets = [];
  enemies = [];
  enemyBullets = [];
  particles = [];
  score = 0;
  lives = 3;
  progress = 0;
  bossSpawned = false;
  hordeMode = false;
  gameOver = false;
  victory = false;
  waveTimer = 0;
  areaCooldown = 0;
  lastTime = 0;
  running = true;
  updateHUD();
  requestAnimationFrame(gameLoop);
}

window.initGame = initGame;
window.endGame = endGame;