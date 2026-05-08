import type {
  GameState, Player, Enemy, Aiko, Particle, ChainEffect,
  EnemyType, AikoStateType, Vec2,
} from './types';
import {
  CANVAS_W, CANVAS_H, WALL_TOP, WALL_BOTTOM, OBSTACLES,
  DIALOGUE_TRUST_RESULT, DIALOGUE_DEPENDENCY_RESULT,
  DIALOGUE_PRE_COMBAT, DIALOGUE_POST_COMBAT_DEPENDENCY, DIALOGUE_POST_COMBAT_TRUST,
} from './gameData';

// ── Math helpers ────────────────────────────────────────────────────────────────
export function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
}

function getCastOrigin(pos: Vec2, facing: Vec2, radius: number): Vec2 {
  const dir = normalize(facing.x === 0 && facing.y === 0 ? { x: 1, y: 0 } : facing);
  const side = { x: -dir.y, y: dir.x };
  return {
    x: pos.x + dir.x * radius * 0.7 + side.x * radius * 0.5,
    y: pos.y + dir.y * radius * 0.7 + side.y * radius * 0.5 - radius * 0.65,
  };
}

function getEnemyImpactPoint(enemy: Enemy): Vec2 {
  return {
    x: enemy.pos.x,
    y: enemy.pos.y - enemy.radius * 0.8,
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Circle vs rect collision – returns normal if colliding
function circleRectCollision(
  cx: number, cy: number, r: number,
  rx: number, ry: number, rw: number, rh: number,
): { hit: boolean; nx: number; ny: number; overlap: number } {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX, dy = cy - closestY;
  const distSq = dx * dx + dy * dy;
  if (distSq < r * r) {
    const d = Math.sqrt(distSq) || 0.001;
    return { hit: true, nx: dx / d, ny: dy / d, overlap: r - d };
  }
  return { hit: false, nx: 0, ny: 0, overlap: 0 };
}

// Circle vs circle resolve
function resolveCircles(a: Vec2, ra: number, b: Vec2, rb: number): Vec2 | null {
  const dx = a.x - b.x, dy = a.y - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const minDist = ra + rb;
  if (d < minDist && d > 0) {
    const factor = (minDist - d) / d;
    return { x: dx * factor * 0.5, y: dy * factor * 0.5 };
  }
  return null;
}

function clampToArena(pos: Vec2, r: number) {
  pos.x = clamp(pos.x, r + 30, CANVAS_W - r - 30);
  pos.y = clamp(pos.y, WALL_TOP + r, WALL_BOTTOM - r);
}

function resolveObstacles(pos: Vec2, r: number) {
  for (const obs of OBSTACLES) {
    const col = circleRectCollision(pos.x, pos.y, r, obs.x, obs.y, obs.w, obs.h);
    if (col.hit) {
      pos.x += col.nx * col.overlap;
      pos.y += col.ny * col.overlap;
    }
  }
}

// ── Rain initialiser ────────────────────────────────────────────────────────────
export function initRain(): Particle[] {
  const drops: Particle[] = [];
  for (let i = 0; i < 200; i++) {
    drops.push(makeRainDrop(Math.random() * CANVAS_W, Math.random() * CANVAS_H));
  }
  return drops;
}

function makeRainDrop(x: number, y: number): Particle {
  return {
    x, y,
    vx: 0.8, vy: 10 + Math.random() * 5,
    life: 1, maxLife: 1,
    type: 'rain',
    color: `rgba(${80 + Math.random() * 40},${120 + Math.random() * 40},255,${0.2 + Math.random() * 0.2})`,
    size: 1,
  };
}

// ── Spawn helpers ────────────────────────────────────────────────────────────────
function spawnEnemy(gs: GameState, type: EnemyType, x: number, y: number) {
  const id = gs.enemyIdCounter++;
  const common = type === 'common';
  gs.enemies.push({
    id,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    radius: common ? 18 : 26,
    health: common ? 55 : 130,
    maxHealth: common ? 55 : 130,
    type,
    speed: common ? 1.6 : 0.85,
    damage: common ? 8 : 20,
    attackRange: common ? 45 : 55,
    attackCooldown: 0,
    stunTimer: 0,
    slowTimer: 0,
    aiState: 'patrol',
    hitFlash: 0,
    deathTimer: 0,
    patrolTarget: { x, y },
  });
}

export function spawnWave(gs: GameState, wave: number) {
  const spawnPoints = [
    { x: 870, y: 150 },
    { x: 870, y: 260 },
    { x: 870, y: 370 },
  ];
  if (wave === 1) {
    spawnEnemy(gs, 'common', spawnPoints[0].x, spawnPoints[0].y);
    spawnEnemy(gs, 'common', spawnPoints[2].x, spawnPoints[2].y);
  } else if (wave === 2) {
    spawnEnemy(gs, 'common', spawnPoints[1].x, spawnPoints[1].y);
    spawnEnemy(gs, 'heavy', spawnPoints[0].x, spawnPoints[0].y);
  } else if (wave === 3) {
    spawnEnemy(gs, 'heavy', spawnPoints[1].x, spawnPoints[1].y);
  }
}

// ── Particle helpers ────────────────────────────────────────────────────────────
export function spawnHitParticles(gs: GameState, x: number, y: number, color: string) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    gs.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20, maxLife: 20,
      type: 'hit',
      color,
      size: 3 + Math.random() * 3,
    });
  }
}

function spawnSparkParticles(gs: GameState, x: number, y: number, type: 'bond' | 'forced') {
  const color = type === 'bond' ? '#88ccff' : '#ff6622';
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    gs.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 25, maxLife: 25,
      type: 'spark',
      color,
      size: 2 + Math.random() * 2,
    });
  }
}

// ── Player ability: Bond Thread (Q) ────────────────────────────────────────────
export function fireBondThread(gs: GameState) {
  const p = gs.player;
  if (p.qCooldown > 0 || p.eloEnergy < 15) return;
  const target = nearestEnemy(gs);
  if (!target) return;
  const origin = getCastOrigin(p.pos, p.facing, p.radius);
  const impact = getEnemyImpactPoint(target);

  p.qCooldown = 50;
  p.eloEnergy = Math.max(0, p.eloEnergy - 15);

  target.health -= 12;
  target.slowTimer = 150;
  if (target.health <= 0) {
    target.aiState = 'dead';
    target.deathTimer = 40;
  }
  if (target.health > 0) target.hitFlash = 8;

  const chainId = gs.chainIdCounter++;
  gs.chainEffects.push({
    id: chainId,
    fromX: origin.x, fromY: origin.y,
    toX: impact.x, toY: impact.y,
    type: 'bond',
    timer: 55, maxTimer: 55,
  });
  spawnSparkParticles(gs, impact.x, impact.y, 'bond');
  spawnHitParticles(gs, impact.x, impact.y, '#4499ff');
}

// ── Player ability: Forced Chain (E) ────────────────────────────────────────────
export function fireForcedChain(gs: GameState) {
  const p = gs.player;
  if (p.eCooldown > 0 || p.eloEnergy < 25) return;
  const target = nearestEnemy(gs);
  if (!target) return;
  const origin = getCastOrigin(p.pos, p.facing, p.radius);
  const impact = getEnemyImpactPoint(target);

  p.eCooldown = 70;
  p.eloEnergy = Math.max(0, p.eloEnergy - 25);
  p.stability = Math.max(0, p.stability - 10);
  p.forcedChainCount++;

  target.health -= 28;
  target.stunTimer = 100;
  target.aiState = 'stunned';
  if (target.health <= 0) {
    target.aiState = 'dead';
    target.deathTimer = 40;
  }
  if (target.health > 0) target.hitFlash = 12;

  // Aiko bond impact
  const aiko = gs.aiko;
  aiko.dependency = clamp(aiko.dependency + 13, 0, 100);
  aiko.autonomy = clamp(aiko.autonomy - 9, 0, 100);
  updateAikoState(aiko);

  // Phrases based on dependency
  if (aiko.dependency > 60 && !aiko.phrase) {
    aiko.phrase = 'Não me deixa para trás...';
    aiko.phraseTimer = 180;
  } else if (aiko.dependency > 35 && !aiko.phrase) {
    aiko.phrase = 'Quando você faz isso...';
    aiko.phraseTimer = 150;
  }

  const chainId = gs.chainIdCounter++;
  gs.chainEffects.push({
    id: chainId,
    fromX: origin.x, fromY: origin.y,
    toX: impact.x, toY: impact.y,
    type: 'forced',
    timer: 75, maxTimer: 75,
  });
  spawnSparkParticles(gs, impact.x, impact.y, 'forced');
  spawnHitParticles(gs, impact.x, impact.y, '#ff6600');
}

function nearestEnemy(gs: GameState): Enemy | null {
  const p = gs.player;
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const e of gs.enemies) {
    if (e.aiState === 'dead') continue;
    const d = dist(p.pos, e.pos);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  return best;
}

// ── Player melee attack ────────────────────────────────────────────────────────
export function playerAttack(gs: GameState, heavy: boolean) {
  const p = gs.player;
  if (p.attackCooldown > 0 || p.isDodging) return;
  p.attackCooldown = heavy ? 65 : 35;
  p.isAttacking = true;
  p.attackTimer = heavy ? 30 : 18;
  p.attackType = heavy ? 'heavy' : 'light';

  const range = heavy ? 62 : 50;
  const dmg = heavy ? 32 : 16;
  const fx = p.pos.x + p.facing.x * range * 0.5;
  const fy = p.pos.y + p.facing.y * range * 0.5;

  for (const e of gs.enemies) {
    if (e.aiState === 'dead') continue;
    if (dist({ x: fx, y: fy }, e.pos) < range * 0.9) {
      e.health -= dmg;
      e.hitFlash = 10;
      if (e.health <= 0) {
        e.aiState = 'dead';
        e.deathTimer = 40;
        spawnHitParticles(gs, e.pos.x, e.pos.y, '#ff3300');
      } else {
        // Knockback
        const n = normalize({ x: e.pos.x - p.pos.x, y: e.pos.y - p.pos.y });
        e.pos.x += n.x * 15;
        e.pos.y += n.y * 15;
        spawnHitParticles(gs, e.pos.x, e.pos.y, '#cc2200');
      }
    }
  }
}

// ── Player dodge ────────────────────────────────────────────────────────────────
export function playerDodge(gs: GameState, dx: number, dy: number) {
  const p = gs.player;
  if (p.dodgeCooldown > 0 || p.isDodging) return;
  p.isDodging = true;
  p.dodgeTimer = 22;
  p.dodgeCooldown = 65;
  p.invincible = true;
  p.invincibleTimer = 22;
  const dir = dx !== 0 || dy !== 0 ? normalize({ x: dx, y: dy }) : p.facing;
  p.dodgeVel = { x: dir.x * 7, y: dir.y * 7 };
}

// ── Aiko state machine ─────────────────────────────────────────────────────────
export function updateAikoState(aiko: Aiko) {
  const prev = aiko.state;
  if (aiko.dependency > 65) aiko.state = 'dependent';
  else if (aiko.dependency > 35 && aiko.autonomy < 30) aiko.state = 'unstable';
  else if (aiko.trust > 55) aiko.state = 'conscious';
  else aiko.state = 'scared';
  return prev !== aiko.state;
}

// ── Main update function ────────────────────────────────────────────────────────
export function updateGameState(
  gs: GameState,
  keys: Set<string>,
  onPhaseChange: (phase: GameState['phase']) => void,
  onGameEnd: (result: import('./types').GameResult) => void,
) {
  gs.frameCount++;

  // Update particles
  updateParticles(gs);

  // Update chain effects
  gs.chainEffects = gs.chainEffects.filter(c => {
    c.timer--;
    return c.timer > 0;
  });

  if (gs.phase === 'INTRO') {
    gs.introTimer++;
    // Auto-advance intro after 4.5 seconds (270 frames) or any key press
    if (gs.introTimer > 270) {
      gs.phase = 'EXPLORE';
      gs.hintText = 'WASD para mover • F para interagir';
      gs.hintTimer = 240;
      onPhaseChange('EXPLORE');
    }
    return;
  }

  if (gs.phase === 'EXPLORE') {
    updatePlayerMovement(gs, keys);
    updateAikoFollow(gs);
    checkNearAiko(gs);

    if (gs.nearAiko) {
      gs.hintText = 'F — Interagir com Aiko';
      gs.hintTimer = 10;
    }
    return;
  }

  if (gs.phase === 'DIALOGUE' || gs.phase === 'PRE_COMBAT') {
    // Update aiko idle animation only
    gs.aiko.bobTimer += 0.04;
    gs.aiko.pulseTimer += 0.05;
    if (gs.aiko.phraseTimer > 0) gs.aiko.phraseTimer--;
    if (gs.aiko.phraseTimer <= 0) gs.aiko.phrase = null;
    return;
  }

  if (gs.phase === 'COMBAT') {
    if (!gs.combatStarted) {
      gs.combatStarted = true;
      gs.combatWave = 1;
      spawnWave(gs, 1);
      gs.hintText = 'J Ataque • K Pesado • Q Fio de Vínculo • E Corrente Forçada • Espaço Esquiva';
      gs.hintTimer = 300;
    }

    // Check wave clear
    const aliveEnemies = gs.enemies.filter(e => e.aiState !== 'dead');
    if (aliveEnemies.length === 0 && gs.waveTransitionTimer === 0) {
      if (gs.combatWave < 3) {
        gs.waveTransitionTimer = 90;
      } else {
        // All waves cleared – go to post combat
        gs.phase = 'POST_COMBAT';
        onPhaseChange('POST_COMBAT');
        return;
      }
    }

    if (gs.waveTransitionTimer > 0) {
      gs.waveTransitionTimer--;
      if (gs.waveTransitionTimer === 0) {
        gs.combatWave++;
        spawnWave(gs, gs.combatWave);
      }
    }

    updatePlayerCombat(gs, keys);
    updateEnemies(gs);
    updateAikoFollow(gs);

    // Aiko phrase timer
    if (gs.aiko.phraseTimer > 0) {
      gs.aiko.phraseTimer--;
      if (gs.aiko.phraseTimer <= 0) gs.aiko.phrase = null;
    }

    // Elo energy regen
    gs.player.eloRegenTimer++;
    if (gs.player.eloRegenTimer > 4) {
      gs.player.eloRegenTimer = 0;
      gs.player.eloEnergy = Math.min(gs.player.maxEloEnergy, gs.player.eloEnergy + 1);
    }

    // Player death
    if (gs.player.health <= 0) {
      gs.player.health = 0;
      gs.phase = 'POST_COMBAT';
      onPhaseChange('POST_COMBAT');
    }
    return;
  }

  if (gs.phase === 'POST_COMBAT' || gs.phase === 'ENDING') {
    gs.aiko.bobTimer += 0.04;
    gs.aiko.pulseTimer += 0.05;
    if (gs.aiko.phraseTimer > 0) gs.aiko.phraseTimer--;
    if (gs.aiko.phraseTimer <= 0) gs.aiko.phrase = null;
  }
}

function updatePlayerMovement(gs: GameState, keys: Set<string>) {
  const p = gs.player;
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const n = normalize({ x: dx, y: dy });
    p.vel.x = n.x * p.speed;
    p.vel.y = n.y * p.speed;
    p.facing = n;
  } else {
    p.vel.x *= 0.75;
    p.vel.y *= 0.75;
  }

  p.pos.x += p.vel.x;
  p.pos.y += p.vel.y;
  clampToArena(p.pos, p.radius);
  resolveObstacles(p.pos, p.radius);

  // Timers
  if (p.attackCooldown > 0) p.attackCooldown--;
  if (p.attackTimer > 0) p.attackTimer--;
  else { p.isAttacking = false; p.attackType = null; }
  if (p.qCooldown > 0) p.qCooldown--;
  if (p.eCooldown > 0) p.eCooldown--;
  if (p.hitFlash > 0) p.hitFlash--;
  if (gs.hintTimer > 0) gs.hintTimer--;
}

function updatePlayerCombat(gs: GameState, keys: Set<string>) {
  const p = gs.player;
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  if (p.isDodging) {
    p.pos.x += p.dodgeVel.x;
    p.pos.y += p.dodgeVel.y;
    p.dodgeTimer--;
    if (p.dodgeTimer <= 0) {
      p.isDodging = false;
      p.dodgeVel = { x: 0, y: 0 };
    }
  } else if (dx !== 0 || dy !== 0) {
    const n = normalize({ x: dx, y: dy });
    p.vel.x = n.x * p.speed;
    p.vel.y = n.y * p.speed;
    p.facing = n;
  } else {
    p.vel.x *= 0.7;
    p.vel.y *= 0.7;
  }

  if (!p.isDodging) {
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
  }

  clampToArena(p.pos, p.radius);
  resolveObstacles(p.pos, p.radius);

  // Resolve collisions with enemies
  for (const e of gs.enemies) {
    if (e.aiState === 'dead') continue;
    const push = resolveCircles(p.pos, p.radius, e.pos, e.radius);
    if (push) { p.pos.x += push.x * 0.5; p.pos.y += push.y * 0.5; }
  }

  // Timers
  if (p.attackCooldown > 0) p.attackCooldown--;
  if (p.attackTimer > 0) p.attackTimer--;
  else { p.isAttacking = false; p.attackType = null; }
  if (p.dodgeCooldown > 0) p.dodgeCooldown--;
  if (p.qCooldown > 0) p.qCooldown--;
  if (p.eCooldown > 0) p.eCooldown--;
  if (p.hitFlash > 0) p.hitFlash--;
  if (p.invincibleTimer > 0) { p.invincibleTimer--; }
  else { p.invincible = false; }
  if (gs.hintTimer > 0) gs.hintTimer--;
}

function updateEnemies(gs: GameState) {
  const p = gs.player;

  for (const e of gs.enemies) {
    if (e.aiState === 'dead') {
      if (e.deathTimer > 0) e.deathTimer--;
      continue;
    }
    if (e.hitFlash > 0) e.hitFlash--;
    if (e.attackCooldown > 0) e.attackCooldown--;
    if (e.slowTimer > 0) e.slowTimer--;

    if (e.stunTimer > 0) {
      e.stunTimer--;
      e.aiState = 'stunned';
      continue;
    }

    const d = dist(e.pos, p.pos);
    const effectiveSpeed = e.slowTimer > 0 ? e.speed * 0.25 : e.speed;

    if (d > 400) {
      // Patrol
      e.aiState = 'patrol';
      // Slowly drift toward player
      const dir = normalize({ x: p.pos.x - e.pos.x, y: p.pos.y - e.pos.y });
      e.vel.x = dir.x * effectiveSpeed * 0.4;
      e.vel.y = dir.y * effectiveSpeed * 0.4;
    } else if (d > e.attackRange + 5) {
      // Chase
      e.aiState = 'chase';
      const dir = normalize({ x: p.pos.x - e.pos.x, y: p.pos.y - e.pos.y });
      e.vel.x = dir.x * effectiveSpeed;
      e.vel.y = dir.y * effectiveSpeed;
    } else {
      // Attack
      e.aiState = 'attack';
      e.vel.x *= 0.5;
      e.vel.y *= 0.5;
      if (e.attackCooldown <= 0 && !p.invincible) {
        p.health = Math.max(0, p.health - e.damage);
        p.hitFlash = 12;
        e.attackCooldown = e.type === 'heavy' ? 100 : 75;
        // Push player back
        const dir = normalize({ x: p.pos.x - e.pos.x, y: p.pos.y - e.pos.y });
        p.pos.x += dir.x * 20;
        p.pos.y += dir.y * 20;
        spawnHitParticles(gs, p.pos.x, p.pos.y, '#ffffff');
      }
    }

    e.pos.x += e.vel.x;
    e.pos.y += e.vel.y;
    clampToArena(e.pos, e.radius);
    resolveObstacles(e.pos, e.radius);

    // Resolve enemy-enemy collisions
    for (const other of gs.enemies) {
      if (other.id === e.id || other.aiState === 'dead') continue;
      const push = resolveCircles(e.pos, e.radius, other.pos, other.radius);
      if (push) { e.pos.x += push.x * 0.5; e.pos.y += push.y * 0.5; }
    }
    // Enemy vs player collision
    const push = resolveCircles(e.pos, e.radius, p.pos, p.radius);
    if (push) { e.pos.x += push.x; e.pos.y += push.y; }
  }
}

function updateAikoFollow(gs: GameState) {
  const aiko = gs.aiko;
  const player = gs.player;
  aiko.bobTimer += 0.04;
  aiko.pulseTimer += 0.05;
  if (aiko.phraseTimer > 0) aiko.phraseTimer--;
  if (aiko.phraseTimer <= 0) aiko.phrase = null;

  if (gs.phase === 'COMBAT') {
    // Aiko follows player but keeps distance (stays behind)
    const followDist = aiko.dependency > 50 ? 40 : 70;
    const dx = player.pos.x - aiko.pos.x;
    const dy = player.pos.y - aiko.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > followDist) {
      const speed = 0.04 * (1 + aiko.dependency / 100);
      aiko.pos.x += dx * speed;
      aiko.pos.y += dy * speed;
    }
    clampToArena(aiko.pos, aiko.radius);
    resolveObstacles(aiko.pos, aiko.radius);
  }
}

function checkNearAiko(gs: GameState) {
  const d = dist(gs.player.pos, gs.aiko.pos);
  gs.nearAiko = d < 80;
}

function updateParticles(gs: GameState) {
  // Update existing particles
  for (let i = gs.particles.length - 1; i >= 0; i--) {
    const p = gs.particles[i];
    if (p.type === 'rain') {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > CANVAS_H + 10 || p.x < -20) {
        // Reset to top
        gs.particles[i] = makeRainDrop(Math.random() * CANVAS_W + 50, -10);
      }
    } else {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.88;
      p.vy *= 0.88;
      p.life--;
      if (p.life <= 0) {
        gs.particles.splice(i, 1);
      }
    }
  }
}

// ── Dialogue helpers ────────────────────────────────────────────────────────────
export function startDialogue(gs: GameState, lines: typeof gs.dialogueQueue) {
  gs.dialogueActive = true;
  gs.dialogueQueue = lines;
  gs.dialogueIndex = 0;
  gs.awaitingChoice = lines[0]?.choices != null;
}

export function advanceDialogue(
  gs: GameState,
  onPhaseChange: (p: GameState['phase']) => void,
  onGameEnd: (r: import('./types').GameResult) => void,
) {
  const next = gs.dialogueIndex + 1;
  if (next >= gs.dialogueQueue.length) {
    gs.dialogueActive = false;
    gs.dialogueQueue = [];
    gs.dialogueIndex = 0;
    gs.awaitingChoice = false;
    handleDialogueEnd(gs, onPhaseChange, onGameEnd);
  } else {
    gs.dialogueIndex = next;
    gs.awaitingChoice = gs.dialogueQueue[next]?.choices != null;
  }
}

export function makeChoice(
  gs: GameState,
  effect: 'trust' | 'dependency',
  onPhaseChange: (p: GameState['phase']) => void,
) {
  gs.chosenPath = effect;
  gs.awaitingChoice = false;

  if (effect === 'trust') {
    gs.aiko.trust = Math.min(100, gs.aiko.trust + 25);
    gs.aiko.autonomy = Math.min(100, gs.aiko.autonomy + 10);
    gs.dialogueActive = false;
    startDialogue(gs, DIALOGUE_TRUST_RESULT);
  } else {
    gs.aiko.dependency = Math.min(100, gs.aiko.dependency + 30);
    gs.aiko.autonomy = Math.max(0, gs.aiko.autonomy - 20);
    updateAikoState(gs.aiko);
    gs.dialogueActive = false;
    startDialogue(gs, DIALOGUE_DEPENDENCY_RESULT);
  }
  gs.phase = 'DIALOGUE';
  onPhaseChange('DIALOGUE');
}

function handleDialogueEnd(
  gs: GameState,
  onPhaseChange: (p: GameState['phase']) => void,
  onGameEnd: (r: import('./types').GameResult) => void,
) {
  if (gs.phase === 'DIALOGUE') {
    // Was the result dialogue? Now move to PRE_COMBAT
    gs.phase = 'PRE_COMBAT';
    onPhaseChange('PRE_COMBAT');
    startDialogue(gs, DIALOGUE_PRE_COMBAT);
  } else if (gs.phase === 'PRE_COMBAT') {
    // Move to COMBAT
    gs.phase = 'COMBAT';
    onPhaseChange('COMBAT');
  } else if (gs.phase === 'POST_COMBAT') {
    // End game
    gs.phase = 'ENDING';
    onPhaseChange('ENDING');
    onGameEnd({
      dependency: gs.aiko.dependency,
      trust: gs.aiko.trust,
      autonomy: gs.aiko.autonomy,
      forcedChainCount: gs.player.forcedChainCount,
      chosenPath: gs.chosenPath,
    });
  }
}

export function startPostCombatDialogue(gs: GameState, onPhaseChange: (p: GameState['phase']) => void) {
  gs.phase = 'POST_COMBAT';
  onPhaseChange('POST_COMBAT');
  const lines =
    gs.aiko.dependency > 40 || gs.player.forcedChainCount >= 3
      ? DIALOGUE_POST_COMBAT_DEPENDENCY
      : DIALOGUE_POST_COMBAT_TRUST;
  startDialogue(gs, lines);
}
