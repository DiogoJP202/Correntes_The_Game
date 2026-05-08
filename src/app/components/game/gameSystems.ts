import type {
  Aiko,
  DialogueChoiceEffect,
  Enemy,
  EnemyType,
  GameState,
  MemoryInteractableId,
  Particle,
  Vec2,
} from './types';
import {
  CANVAS_H,
  CANVAS_W,
  DIALOGUE_DEPENDENCY_RESULT,
  DIALOGUE_POST_COMBAT_DEPENDENCY,
  DIALOGUE_POST_COMBAT_TRUST,
  DIALOGUE_PRE_COMBAT,
  DIALOGUE_TRUST_RESULT,
  LIA_SIT_TARGET,
  MEMORY_DIALOGUE_BURDEN,
  MEMORY_DIALOGUE_LIGHTNESS,
  MEMORY_DIALOGUE_OPENING,
  MEMORY_DIALOGUE_VULNERABILITY,
  MEMORY_BOTTOM,
  MEMORY_INTERACTABLES,
  MEMORY_LEFT,
  MEMORY_OBSTACLES,
  MEMORY_RIGHT,
  MEMORY_TOP,
  OBSTACLES,
  WALL_BOTTOM,
  WALL_TOP,
  createPresentPlayer,
  createInitialAiko,
} from './gameData';
import { addCameraShake } from './CameraShake';
import { updateDialogueCameraController } from './DialogueCameraController';
import {
  spawnBondImpactVFX,
  spawnForcedImpactVFX,
  spawnHeavyAttackVFX,
  spawnStabilityLeakVFX,
} from './ImpactVFXSpawner';

export function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function isMemoryPhase(phase: GameState['phase']) {
  return (
    phase === 'MEMORY_FADE_IN' ||
    phase === 'MEMORY_EXPLORE' ||
    phase === 'MEMORY_APPROACH' ||
    phase === 'MEMORY_DIALOGUE' ||
    phase === 'MEMORY_OUTRO'
  );
}

function getCastOrigin(pos: Vec2, facing: Vec2, radius: number): Vec2 {
  const dir = normalize(facing.x === 0 && facing.y === 0 ? { x: 1, y: 0 } : facing);
  const side = { x: -dir.y, y: dir.x };
  return {
    x: pos.x + dir.x * radius * 0.75 + side.x * radius * 0.5,
    y: pos.y + dir.y * radius * 0.75 + side.y * radius * 0.5 - radius * 0.66,
  };
}

function getEnemyImpactPoint(enemy: Enemy): Vec2 {
  return {
    x: enemy.pos.x,
    y: enemy.pos.y - enemy.radius * 0.8,
  };
}

function circleRectCollision(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): { hit: boolean; nx: number; ny: number; overlap: number } {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;
  if (distSq < r * r) {
    const d = Math.sqrt(distSq) || 0.001;
    return { hit: true, nx: dx / d, ny: dy / d, overlap: r - d };
  }
  return { hit: false, nx: 0, ny: 0, overlap: 0 };
}

function resolveCircles(a: Vec2, ra: number, b: Vec2, rb: number): Vec2 | null {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const minDist = ra + rb;
  if (d < minDist && d > 0) {
    const factor = (minDist - d) / d;
    return { x: dx * factor * 0.5, y: dy * factor * 0.5 };
  }
  return null;
}

function clampToArena(pos: Vec2, r: number, memory: boolean) {
  if (memory) {
    pos.x = clamp(pos.x, MEMORY_LEFT + r, MEMORY_RIGHT - r);
    pos.y = clamp(pos.y, MEMORY_TOP + r, MEMORY_BOTTOM - r);
    return;
  }

  pos.x = clamp(pos.x, r + 28, CANVAS_W - r - 28);
  pos.y = clamp(pos.y, WALL_TOP + r, WALL_BOTTOM - r);
}

function resolveObstacles(pos: Vec2, r: number, memory: boolean) {
  const obstacles = memory ? MEMORY_OBSTACLES : OBSTACLES;
  for (const obs of obstacles) {
    const col = circleRectCollision(pos.x, pos.y, r, obs.x, obs.y, obs.w, obs.h);
    if (col.hit) {
      pos.x += col.nx * col.overlap;
      pos.y += col.ny * col.overlap;
    }
  }
}

export function initRain(): Particle[] {
  const drops: Particle[] = [];
  for (let i = 0; i < 220; i++) {
    drops.push(makeRainDrop(Math.random() * CANVAS_W, Math.random() * CANVAS_H));
  }
  return drops;
}

function makeRainDrop(x: number, y: number): Particle {
  return {
    x,
    y,
    vx: 0.7,
    vy: 10 + Math.random() * 6,
    life: 1,
    maxLife: 1,
    type: 'rain',
    color: `rgba(${84 + Math.random() * 30},${128 + Math.random() * 40},255,${0.18 + Math.random() * 0.22})`,
    size: 1,
    elongation: 2.8 + Math.random() * 1.6,
  };
}

export function initMemoryParticles(): Particle[] {
  const motes: Particle[] = [];
  for (let i = 0; i < 54; i++) {
    motes.push(makeMemoryDust());
  }
  return motes;
}

function makeMemoryDust() {
  return {
    x: randomRange(MEMORY_LEFT - 20, MEMORY_RIGHT + 20),
    y: randomRange(MEMORY_TOP - 14, MEMORY_BOTTOM + 10),
    vx: randomRange(-0.12, 0.18),
    vy: randomRange(-0.06, 0.05),
    life: 1,
    maxLife: 1,
    type: 'dust' as const,
    color: `rgba(255,${220 + Math.floor(Math.random() * 18)},${180 + Math.floor(Math.random() * 22)},${0.16 + Math.random() * 0.18})`,
    size: 1.1 + Math.random() * 1.8,
    glow: 5 + Math.random() * 4,
  };
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function spawnEnemy(gs: GameState, type: EnemyType, x: number, y: number) {
  const id = gs.enemyIdCounter++;
  const common = type === 'common';
  gs.enemies.push({
    id,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    radius: common ? 18 : 26,
    health: common ? 56 : 138,
    maxHealth: common ? 56 : 138,
    type,
    speed: common ? 1.72 : 0.88,
    damage: common ? 9 : 22,
    attackRange: common ? 48 : 60,
    attackCooldown: 0,
    attackTelegraph: 0,
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
    { x: 860, y: 144 },
    { x: 868, y: 258 },
    { x: 856, y: 374 },
  ];

  if (wave === 1) {
    spawnEnemy(gs, 'common', spawnPoints[0].x, spawnPoints[0].y);
    spawnEnemy(gs, 'common', spawnPoints[2].x, spawnPoints[2].y);
  } else if (wave === 2) {
    spawnEnemy(gs, 'common', spawnPoints[1].x, spawnPoints[1].y);
    spawnEnemy(gs, 'heavy', spawnPoints[0].x, spawnPoints[0].y);
  } else if (wave === 3) {
    spawnEnemy(gs, 'heavy', spawnPoints[1].x, spawnPoints[1].y);
    spawnEnemy(gs, 'common', spawnPoints[2].x, spawnPoints[2].y);
  }
}

function nearestEnemy(gs: GameState): Enemy | null {
  const p = gs.player;
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const e of gs.enemies) {
    if (e.aiState === 'dead') continue;
    const d = dist(p.pos, e.pos);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

export function fireBondThread(gs: GameState) {
  const p = gs.player;
  if (p.qCooldown > 0 || p.eloEnergy < 16) return;
  const target = nearestEnemy(gs);
  if (!target) return;

  const origin = getCastOrigin(p.pos, p.facing, p.radius);
  const impact = getEnemyImpactPoint(target);
  p.qCooldown = 52;
  p.eloEnergy = Math.max(0, p.eloEnergy - 16);
  p.castTimer = 14;
  p.castType = 'bond';

  target.health -= 12;
  target.slowTimer = target.type === 'heavy' ? 90 : 150;
  if (target.health <= 0) {
    target.aiState = 'dead';
    target.deathTimer = 44;
  } else {
    target.hitFlash = 8;
  }

  gs.chainEffects.push({
    id: gs.chainIdCounter++,
    fromX: origin.x,
    fromY: origin.y,
    toX: impact.x,
    toY: impact.y,
    type: 'bond',
    timer: 58,
    maxTimer: 58,
  });

  spawnBondImpactVFX(gs, impact.x, impact.y);
  addCameraShake(gs.camera, 1.4);
}

export function fireForcedChain(gs: GameState) {
  const p = gs.player;
  if (p.eCooldown > 0 || p.eloEnergy < 28) return;
  const target = nearestEnemy(gs);
  if (!target) return;

  const origin = getCastOrigin(p.pos, p.facing, p.radius);
  const impact = getEnemyImpactPoint(target);
  const aiko = gs.aiko;
  const aikoNear = dist(aiko.pos, p.pos) < 180;

  p.eCooldown = 76;
  p.eloEnergy = Math.max(0, p.eloEnergy - 28);
  p.stability = Math.max(0, p.stability - 12);
  p.forcedChainCount += 1;
  p.castTimer = 18;
  p.castType = 'forced';

  target.health -= 28;
  target.stunTimer = target.type === 'heavy' ? 62 : 104;
  target.aiState = 'stunned';
  if (target.health <= 0) {
    target.aiState = 'dead';
    target.deathTimer = 46;
  } else {
    target.hitFlash = 12;
  }

  aiko.dependency = clamp(aiko.dependency + (aikoNear ? 14 : 8), 0, 100);
  aiko.autonomy = clamp(aiko.autonomy - (aikoNear ? 10 : 6), 0, 100);
  updateAikoState(aiko);

  if (aiko.dependency > 62 && !aiko.phrase) {
    aiko.phrase = 'Nao me deixa para tras...';
    aiko.phraseTimer = 180;
  } else if (aiko.dependency > 36 && !aiko.phrase) {
    aiko.phrase = 'Quando voce usa isso...';
    aiko.phraseTimer = 150;
  }

  gs.chainEffects.push({
    id: gs.chainIdCounter++,
    fromX: origin.x,
    fromY: origin.y,
    toX: impact.x,
    toY: impact.y,
    type: 'forced',
    timer: 78,
    maxTimer: 78,
  });

  spawnForcedImpactVFX(gs, impact.x, impact.y);
  addCameraShake(gs.camera, 4.4);
}

export function playerAttack(gs: GameState, heavy: boolean) {
  const p = gs.player;
  if (p.attackCooldown > 0 || p.isDodging) return;

  p.attackCooldown = heavy ? 72 : 36;
  p.isAttacking = true;
  p.attackTimer = heavy ? 32 : 18;
  p.attackType = heavy ? 'heavy' : 'light';

  const range = heavy ? 64 : 52;
  const dmg = heavy ? 32 : 16;
  const hitPoint = {
    x: p.pos.x + p.facing.x * range * 0.55,
    y: p.pos.y + p.facing.y * range * 0.55,
  };

  let hitCount = 0;
  for (const enemy of gs.enemies) {
    if (enemy.aiState === 'dead') continue;
    if (dist(hitPoint, enemy.pos) < range * 0.92) {
      enemy.health -= dmg;
      enemy.hitFlash = 10;
      hitCount++;
      if (enemy.health <= 0) {
        enemy.aiState = 'dead';
        enemy.deathTimer = 42;
      } else {
        const n = normalize({ x: enemy.pos.x - p.pos.x, y: enemy.pos.y - p.pos.y });
        enemy.pos.x += n.x * (heavy ? 18 : 12);
        enemy.pos.y += n.y * (heavy ? 18 : 12);
      }
    }
  }

  if (hitCount > 0 && heavy) {
    spawnHeavyAttackVFX(gs, hitPoint.x, hitPoint.y);
    addCameraShake(gs.camera, 2.4);
  } else if (hitCount > 0) {
    addCameraShake(gs.camera, 0.8);
  }
}

export function playerDodge(gs: GameState, dx: number, dy: number) {
  const p = gs.player;
  if (p.dodgeCooldown > 0 || p.isDodging) return;

  p.isDodging = true;
  p.dodgeTimer = 22;
  p.dodgeCooldown = 66;
  p.invincible = true;
  p.invincibleTimer = 22;
  const dir = dx !== 0 || dy !== 0 ? normalize({ x: dx, y: dy }) : p.facing;
  p.dodgeVel = { x: dir.x * 8.4, y: dir.y * 8.4 };
}

export function updateAikoState(aiko: Aiko) {
  const prev = aiko.state;
  if (aiko.dependency > 68) aiko.state = 'dependent';
  else if (aiko.dependency > 34 && aiko.autonomy < 34) aiko.state = 'unstable';
  else if (aiko.trust > 56 && aiko.autonomy > 42) aiko.state = 'conscious';
  else aiko.state = 'scared';
  return prev !== aiko.state;
}

function setPhase(gs: GameState, phase: GameState['phase'], onPhaseChange?: (phase: GameState['phase']) => void) {
  gs.phase = phase;
  gs.phaseTimer = 0;
  onPhaseChange?.(phase);
}

function findMemoryTarget(gs: GameState): MemoryInteractableId | 'lia' | null {
  let best: MemoryInteractableId | 'lia' | null = null;
  let bestDistance = Infinity;

  const liaDistance = dist(gs.player.pos, gs.lia.pos);
  if (liaDistance < 72) {
    best = 'lia';
    bestDistance = liaDistance;
  }

  for (const interactable of MEMORY_INTERACTABLES) {
    const d = Math.hypot(gs.player.pos.x - interactable.x, gs.player.pos.y - interactable.y);
    if (d < interactable.radius && d < bestDistance) {
      best = interactable.id;
      bestDistance = d;
    }
  }

  return best;
}

function getMemoryPrompt(target: MemoryInteractableId | 'lia' | null) {
  if (target === 'lia') return 'F - Sentar';
  if (!target) return '';
  const interactable = MEMORY_INTERACTABLES.find((item) => item.id === target);
  return interactable ? `F - ${interactable.prompt}` : '';
}

function pushNarrativeInteraction(gs: GameState, id: MemoryInteractableId) {
  if (!gs.narrative.rooftopInteractions.includes(id)) {
    gs.narrative.rooftopInteractions = [...gs.narrative.rooftopInteractions, id];
  }
}

export function interactWithMemoryScene(gs: GameState, onPhaseChange: (phase: GameState['phase']) => void) {
  if (gs.phase !== 'MEMORY_EXPLORE' || gs.memory.inspectLockTimer > 0) return false;

  const target = gs.memory.nearbyTarget;
  if (!target) return false;

  if (target === 'lia') {
    gs.memory.inspectLockTimer = 18;
    gs.memory.thoughtText = '';
    gs.memory.thoughtTimer = 0;
    gs.player.vel = { x: 0, y: 0 };
    gs.player.facing = normalize({ x: gs.lia.pos.x - gs.player.pos.x, y: gs.lia.pos.y - gs.player.pos.y });
    setPhase(gs, 'MEMORY_APPROACH', onPhaseChange);
    return true;
  }

  const interactable = MEMORY_INTERACTABLES.find((item) => item.id === target);
  if (!interactable) return false;

  gs.memory.thoughtText = interactable.thought;
  gs.memory.thoughtTimer = 180;
  gs.memory.inspectLockTimer = 16;
  gs.player.vel = { x: 0, y: 0 };
  pushNarrativeInteraction(gs, interactable.id);
  return true;
}

function spawnMemoryBond(
  gs: GameState,
  style: 'memory-bond' | 'memory-bond-stable' | 'memory-bond-strained' | 'memory-bond-warm' | 'memory-bond-final',
  maxTimer = 94,
) {
  gs.chainEffects.push({
    id: gs.chainIdCounter++,
    fromX: gs.player.pos.x + 8,
    fromY: gs.player.pos.y - 28,
    toX: gs.lia.pos.x - 6,
    toY: gs.lia.pos.y - 30,
    type: 'bond',
    style,
    timer: maxTimer,
    maxTimer,
  });
}

export function triggerMemoryBondEffect(gs: GameState, variant: 'first' | 'stable' | 'strained' | 'warm' | 'final') {
  if (variant === 'first') {
    gs.narrative.firstThreadWitnessed = true;
    spawnMemoryBond(gs, 'memory-bond', 102);
    return;
  }

  if (variant === 'stable') {
    gs.narrative.scene1BondVariant = 'stable';
    spawnMemoryBond(gs, 'memory-bond-stable', 112);
    return;
  }

  if (variant === 'strained') {
    gs.narrative.scene1BondVariant = 'strained';
    spawnMemoryBond(gs, 'memory-bond-strained', 112);
    return;
  }

  if (variant === 'warm') {
    gs.narrative.scene1BondVariant = 'warm';
    spawnMemoryBond(gs, 'memory-bond-warm', 112);
    return;
  }

  spawnMemoryBond(gs, 'memory-bond-final', 126);
}

function beginMemoryDialogue(gs: GameState, onPhaseChange: (phase: GameState['phase']) => void) {
  gs.player.pos.x = lerp(gs.player.pos.x, LIA_SIT_TARGET.x, 0.65);
  gs.player.pos.y = lerp(gs.player.pos.y, LIA_SIT_TARGET.y, 0.65);
  gs.player.vel = { x: 0, y: 0 };
  gs.player.facing = normalize({ x: gs.lia.pos.x - gs.player.pos.x, y: gs.lia.pos.y - gs.player.pos.y });
  gs.lia.expression = 'neutral';
  setPhase(gs, 'MEMORY_DIALOGUE', onPhaseChange);
  startDialogue(gs, MEMORY_DIALOGUE_OPENING);
}

function transitionMemoryToPresent(gs: GameState, onPhaseChange: (phase: GameState['phase']) => void) {
  gs.player = createPresentPlayer();
  gs.aiko = createInitialAiko();
  gs.enemies = [];
  gs.chainEffects = [];
  gs.dialogueActive = false;
  gs.dialogueQueue = [];
  gs.dialogueIndex = 0;
  gs.awaitingChoice = false;
  gs.hintText = '';
  gs.hintTimer = 0;
  gs.choiceTone = null;
  gs.choiceFlash = 0;
  gs.memory.thoughtText = '';
  gs.memory.thoughtTimer = 0;
  gs.memory.inspectLockTimer = 0;
  gs.memory.nearbyTarget = null;
  gs.memory.finalCaptionAlpha = 0;
  gs.memory.finalCaptionVisible = false;
  gs.memory.outroTimer = 0;
  gs.memory.fadeAlpha = 0;
  gs.particles = initRain();
  gs.introTimer = 0;
  gs.phaseTimer = 0;
  setPhase(gs, 'INTRO', onPhaseChange);
}

export function updateGameState(
  gs: GameState,
  keys: Set<string>,
  onPhaseChange: (phase: GameState['phase']) => void,
  onGameEnd: (result: import('./types').GameResult) => void,
) {
  gs.frameCount++;
  gs.phaseTimer++;
  updateParticles(gs);
  updateChains(gs);
  updateChoiceFlash(gs);

  if (gs.player.stability < 35 && gs.frameCount % 12 === 0) {
    spawnStabilityLeakVFX(gs, gs.player.pos.x, gs.player.pos.y - 20);
  }

  switch (gs.phase) {
    case 'MEMORY_FADE_IN':
      gs.memory.fadeAlpha = Math.max(0, 1 - gs.phaseTimer / 68);
      gs.hintText = '';
      if (gs.phaseTimer > 60) {
        gs.memory.fadeAlpha = 0;
        gs.hintText = 'WASD para mover  |  F para observar';
        gs.hintTimer = 240;
        setPhase(gs, 'MEMORY_EXPLORE', onPhaseChange);
      }
      updateMemoryPresence(gs);
      break;

    case 'MEMORY_EXPLORE':
      updatePlayerLocomotion(gs, keys, false);
      updateMemoryPresence(gs);
      updateMemoryExplore(gs);
      break;

    case 'MEMORY_APPROACH':
      updateMemoryPresence(gs);
      updateMemoryApproach(gs, onPhaseChange);
      break;

    case 'MEMORY_DIALOGUE':
      updateMemoryPresence(gs);
      updateDialogueActors(gs);
      break;

    case 'MEMORY_OUTRO':
      updateMemoryPresence(gs);
      updateMemoryOutro(gs, onPhaseChange);
      break;

    case 'INTRO':
      gs.introTimer++;
      if (gs.introTimer > 280) {
        gs.phase = 'EXPLORE';
        gs.hintText = 'WASD para mover  |  F para interagir';
        gs.hintTimer = 260;
        onPhaseChange('EXPLORE');
      }
      break;

    case 'EXPLORE':
      updatePlayerLocomotion(gs, keys, false);
      updateAikoExplore(gs);
      checkNearAiko(gs);
      if (gs.nearAiko) {
        gs.hintText = 'F - Falar com Aiko';
        gs.hintTimer = 12;
      }
      break;

    case 'DIALOGUE':
    case 'PRE_COMBAT':
      updateDialogueActors(gs);
      break;

    case 'COMBAT':
      if (!gs.combatStarted) {
        gs.combatStarted = true;
        gs.combatWave = 1;
        spawnWave(gs, 1);
        gs.hintText = 'J ataque  |  K pesado  |  Q fio  |  E corrente  |  Espaco esquiva';
        gs.hintTimer = 320;
      }

      if (gs.enemies.filter((enemy) => enemy.aiState !== 'dead').length === 0 && gs.waveTransitionTimer === 0) {
        if (gs.combatWave < 3) {
          gs.waveTransitionTimer = 96;
        } else {
          gs.phase = 'POST_COMBAT';
          onPhaseChange('POST_COMBAT');
          break;
        }
      }

      if (gs.waveTransitionTimer > 0) {
        gs.waveTransitionTimer--;
        if (gs.waveTransitionTimer === 0) {
          gs.combatWave++;
          spawnWave(gs, gs.combatWave);
        }
      }

      updatePlayerLocomotion(gs, keys, true);
      updateEnemies(gs);
      updateAikoCombat(gs);
      updateCombatResources(gs);

      if (gs.player.health <= 0) {
        gs.player.health = 0;
        gs.phase = 'POST_COMBAT';
        onPhaseChange('POST_COMBAT');
      }
      break;

    case 'POST_COMBAT':
    case 'ENDING':
      updateDialogueActors(gs);
      break;
  }

  updateDialogueCameraController(gs);
}

function updateMemoryPresence(gs: GameState) {
  gs.lia.bobTimer += 0.024;
  gs.lia.pulseTimer += 0.018;
  gs.player.castType = null;
  if (gs.memory.thoughtTimer > 0) gs.memory.thoughtTimer--;
  if (gs.memory.thoughtTimer <= 0) gs.memory.thoughtText = '';
  if (gs.memory.inspectLockTimer > 0) gs.memory.inspectLockTimer--;
}

function updateMemoryExplore(gs: GameState) {
  gs.memory.nearbyTarget = findMemoryTarget(gs);
  const prompt = getMemoryPrompt(gs.memory.nearbyTarget);
  if (prompt) {
    gs.hintText = prompt;
    gs.hintTimer = 6;
  } else if (gs.hintTimer <= 0 && gs.phaseTimer < 160) {
    gs.hintText = 'WASD para mover  |  F para observar';
    gs.hintTimer = 10;
  } else if (!prompt && gs.hintTimer <= 0) {
    gs.hintText = '';
  }
}

function updateMemoryApproach(gs: GameState, onPhaseChange: (phase: GameState['phase']) => void) {
  gs.player.vel = { x: 0, y: 0 };
  gs.player.pos.x = lerp(gs.player.pos.x, LIA_SIT_TARGET.x, 0.14);
  gs.player.pos.y = lerp(gs.player.pos.y, LIA_SIT_TARGET.y, 0.14);
  gs.player.facing = normalize({ x: gs.lia.pos.x - gs.player.pos.x, y: gs.lia.pos.y - gs.player.pos.y });
  gs.hintText = '';
  gs.hintTimer = 0;

  if (dist(gs.player.pos, LIA_SIT_TARGET) < 3.4 || gs.phaseTimer > 42) {
    beginMemoryDialogue(gs, onPhaseChange);
  }
}

function updateMemoryOutro(gs: GameState, onPhaseChange: (phase: GameState['phase']) => void) {
  gs.player.vel = { x: 0, y: 0 };
  gs.player.facing = normalize({ x: gs.lia.pos.x - gs.player.pos.x, y: gs.lia.pos.y - gs.player.pos.y });
  gs.memory.outroTimer++;

  if (gs.memory.outroTimer === 18) {
    gs.memory.finalCaptionVisible = true;
    spawnMemoryBond(gs, 'memory-bond-final', 126);
  }

  if (gs.memory.outroTimer < 66) {
    gs.memory.finalCaptionAlpha = clamp(gs.memory.outroTimer / 42, 0, 1);
  } else if (gs.memory.outroTimer > 150) {
    gs.memory.finalCaptionAlpha = clamp(1 - (gs.memory.outroTimer - 150) / 28, 0, 1);
  }

  if (gs.memory.outroTimer > 118) {
    gs.memory.fadeAlpha = clamp((gs.memory.outroTimer - 118) / 42, 0, 1);
  }

  if (gs.memory.outroTimer > 174) {
    transitionMemoryToPresent(gs, onPhaseChange);
  }
}

function updatePlayerLocomotion(gs: GameState, keys: Set<string>, combat: boolean) {
  const p = gs.player;
  const memory = isMemoryPhase(gs.phase);
  let dx = 0;
  let dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (gs.memory.inspectLockTimer > 0 && gs.phase === 'MEMORY_EXPLORE') {
    dx = 0;
    dy = 0;
  }

  if (p.isDodging && combat) {
    p.pos.x += p.dodgeVel.x;
    p.pos.y += p.dodgeVel.y;
    p.dodgeTimer--;
    if (p.dodgeTimer <= 0) {
      p.isDodging = false;
      p.dodgeVel = { x: 0, y: 0 };
    }
  } else {
    const targetSpeed = combat ? p.speed * 1.03 : p.speed;
    if (dx !== 0 || dy !== 0) {
      const n = normalize({ x: dx, y: dy });
      const desiredX = n.x * targetSpeed;
      const desiredY = n.y * targetSpeed;
      const acceleration = combat ? 0.24 : 0.2;
      p.vel.x = lerp(p.vel.x, desiredX, acceleration);
      p.vel.y = lerp(p.vel.y, desiredY, acceleration);
      p.facing = n;
      p.moveTilt = lerp(p.moveTilt, n.x * 0.24, 0.16);
    } else {
      const drag = combat ? 0.72 : 0.76;
      p.vel.x *= drag;
      p.vel.y *= drag;
      p.moveTilt *= 0.8;
    }

    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
  }

  clampToArena(p.pos, p.radius, memory);
  resolveObstacles(p.pos, p.radius, memory);

  if (combat) {
    for (const enemy of gs.enemies) {
      if (enemy.aiState === 'dead') continue;
      const push = resolveCircles(p.pos, p.radius, enemy.pos, enemy.radius);
      if (push) {
        p.pos.x += push.x * 0.5;
        p.pos.y += push.y * 0.5;
      }
    }
  }

  updatePlayerTimers(gs);
}

function updatePlayerTimers(gs: GameState) {
  const p = gs.player;
  if (p.attackCooldown > 0) p.attackCooldown--;
  if (p.attackTimer > 0) p.attackTimer--;
  else {
    p.isAttacking = false;
    p.attackType = null;
  }
  if (p.dodgeCooldown > 0) p.dodgeCooldown--;
  if (p.qCooldown > 0) p.qCooldown--;
  if (p.eCooldown > 0) p.eCooldown--;
  if (p.hitFlash > 0) p.hitFlash--;
  if (p.invincibleTimer > 0) p.invincibleTimer--;
  else p.invincible = false;
  if (p.castTimer > 0) p.castTimer--;
  else p.castType = null;
  if (gs.hintTimer > 0) gs.hintTimer--;
}

function updateEnemies(gs: GameState) {
  const p = gs.player;

  for (const enemy of gs.enemies) {
    if (enemy.aiState === 'dead') {
      if (enemy.deathTimer > 0) enemy.deathTimer--;
      continue;
    }

    if (enemy.hitFlash > 0) enemy.hitFlash--;
    if (enemy.attackCooldown > 0) enemy.attackCooldown--;
    if (enemy.slowTimer > 0) enemy.slowTimer--;

    if (enemy.stunTimer > 0) {
      enemy.stunTimer--;
      enemy.aiState = 'stunned';
      enemy.vel.x *= 0.74;
      enemy.vel.y *= 0.74;
      enemy.pos.x += enemy.vel.x;
      enemy.pos.y += enemy.vel.y;
      continue;
    }

    if (enemy.attackTelegraph > 0) {
      enemy.attackTelegraph--;
      enemy.aiState = 'attack';
      enemy.vel.x *= 0.5;
      enemy.vel.y *= 0.5;
      enemy.pos.x += enemy.vel.x;
      enemy.pos.y += enemy.vel.y;

      if (enemy.attackTelegraph === 0 && !p.invincible) {
        resolveEnemyHit(gs, enemy);
      }

      clampToArena(enemy.pos, enemy.radius, false);
      resolveObstacles(enemy.pos, enemy.radius, false);
      continue;
    }

    const d = dist(enemy.pos, p.pos);
    const effectiveSpeed = enemy.slowTimer > 0 ? enemy.speed * 0.28 : enemy.speed;

    if (d > 420) {
      enemy.aiState = 'patrol';
      const dir = normalize({ x: p.pos.x - enemy.pos.x, y: p.pos.y - enemy.pos.y });
      enemy.vel.x = dir.x * effectiveSpeed * 0.38;
      enemy.vel.y = dir.y * effectiveSpeed * 0.38;
    } else if (d > enemy.attackRange + 10) {
      enemy.aiState = 'chase';
      const dir = normalize({ x: p.pos.x - enemy.pos.x, y: p.pos.y - enemy.pos.y });
      const wobble = enemy.type === 'common' ? Math.sin((gs.frameCount + enemy.id * 11) * 0.11) * 0.18 : 0.04;
      enemy.vel.x = dir.x * effectiveSpeed + wobble;
      enemy.vel.y = dir.y * effectiveSpeed - wobble * 0.6;
    } else {
      enemy.aiState = 'attack';
      enemy.vel.x *= 0.48;
      enemy.vel.y *= 0.48;
      if (enemy.attackCooldown <= 0) {
        enemy.attackTelegraph = enemy.type === 'heavy' ? 24 : 14;
        enemy.attackCooldown = enemy.type === 'heavy' ? 110 : 84;
        addCameraShake(gs.camera, enemy.type === 'heavy' ? 0.8 : 0.3);
      }
    }

    enemy.pos.x += enemy.vel.x;
    enemy.pos.y += enemy.vel.y;
    clampToArena(enemy.pos, enemy.radius, false);
    resolveObstacles(enemy.pos, enemy.radius, false);

    for (const other of gs.enemies) {
      if (other.id === enemy.id || other.aiState === 'dead') continue;
      const push = resolveCircles(enemy.pos, enemy.radius, other.pos, other.radius);
      if (push) {
        enemy.pos.x += push.x * 0.5;
        enemy.pos.y += push.y * 0.5;
      }
    }

    const push = resolveCircles(enemy.pos, enemy.radius, p.pos, p.radius);
    if (push) {
      enemy.pos.x += push.x;
      enemy.pos.y += push.y;
    }
  }
}

function resolveEnemyHit(gs: GameState, enemy: Enemy) {
  const p = gs.player;
  p.health = Math.max(0, p.health - enemy.damage);
  p.hitFlash = 12;
  p.stability = Math.max(0, p.stability - (enemy.type === 'heavy' ? 8 : 4));

  const dir = normalize({ x: p.pos.x - enemy.pos.x, y: p.pos.y - enemy.pos.y });
  p.pos.x += dir.x * (enemy.type === 'heavy' ? 24 : 18);
  p.pos.y += dir.y * (enemy.type === 'heavy' ? 24 : 18);

  spawnHeavyAttackVFX(gs, p.pos.x, p.pos.y - 4);
  addCameraShake(gs.camera, enemy.type === 'heavy' ? 4.8 : 2.1);
}

function updateAikoExplore(gs: GameState) {
  const aiko = gs.aiko;
  aiko.bobTimer += 0.035;
  aiko.pulseTimer += 0.045;
  if (aiko.phraseTimer > 0) aiko.phraseTimer--;
  if (aiko.phraseTimer <= 0) aiko.phrase = null;
}

function updateAikoCombat(gs: GameState) {
  const aiko = gs.aiko;
  const player = gs.player;
  const forward = normalize(player.facing.x === 0 && player.facing.y === 0 ? { x: 1, y: 0 } : player.facing);
  const side = { x: -forward.y, y: forward.x };

  aiko.bobTimer += 0.05;
  aiko.pulseTimer += 0.07;
  if (aiko.phraseTimer > 0) aiko.phraseTimer--;
  if (aiko.phraseTimer <= 0) aiko.phrase = null;

  const followDist =
    aiko.state === 'dependent' ? 38 :
    aiko.state === 'unstable' ? 48 :
    aiko.state === 'conscious' ? 76 :
    62;
  const lateral =
    aiko.state === 'dependent' ? -10 :
    aiko.state === 'conscious' ? 18 :
    -18;

  let desired = {
    x: player.pos.x - forward.x * followDist + side.x * lateral,
    y: player.pos.y - forward.y * followDist + side.y * lateral,
  };

  let threatBiasX = 0;
  let threatBiasY = 0;
  for (const enemy of gs.enemies) {
    if (enemy.aiState === 'dead') continue;
    const threatDist = dist(enemy.pos, aiko.pos);
    if (threatDist < 170) {
      const away = normalize({ x: aiko.pos.x - enemy.pos.x, y: aiko.pos.y - enemy.pos.y });
      const strength = (170 - threatDist) / 170;
      threatBiasX += away.x * strength * 42;
      threatBiasY += away.y * strength * 42;
    }
  }
  desired = { x: desired.x + threatBiasX, y: desired.y + threatBiasY };
  aiko.targetPos = desired;

  const step = aiko.state === 'dependent' ? 0.1 : aiko.state === 'conscious' ? 0.075 : 0.085;
  aiko.pos.x = lerp(aiko.pos.x, desired.x, step);
  aiko.pos.y = lerp(aiko.pos.y, desired.y, step);
  clampToArena(aiko.pos, aiko.radius, false);
  resolveObstacles(aiko.pos, aiko.radius, false);
}

function updateDialogueActors(gs: GameState) {
  gs.aiko.bobTimer += 0.035;
  gs.aiko.pulseTimer += 0.05;
  gs.lia.bobTimer += 0.018;
  gs.lia.pulseTimer += 0.014;
  if (gs.aiko.phraseTimer > 0) gs.aiko.phraseTimer--;
  if (gs.aiko.phraseTimer <= 0) gs.aiko.phrase = null;
  updatePlayerTimers(gs);
}

function updateCombatResources(gs: GameState) {
  gs.player.eloRegenTimer++;
  if (gs.player.eloRegenTimer > 4) {
    gs.player.eloRegenTimer = 0;
    gs.player.eloEnergy = Math.min(gs.player.maxEloEnergy, gs.player.eloEnergy + 1);
  }
}

function checkNearAiko(gs: GameState) {
  gs.nearAiko = dist(gs.player.pos, gs.aiko.pos) < 82;
}

function updateParticles(gs: GameState) {
  for (let i = gs.particles.length - 1; i >= 0; i--) {
    const particle = gs.particles[i];

    if (particle.type === 'rain') {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.y > CANVAS_H + 10 || particle.x < -20) {
        gs.particles[i] = makeRainDrop(Math.random() * CANVAS_W + 50, -10);
      }
      continue;
    }

    if (particle.type === 'dust') {
      particle.x += particle.vx + Math.sin(gs.frameCount * 0.01 + particle.y * 0.04) * 0.06;
      particle.y += particle.vy + Math.cos(gs.frameCount * 0.008 + particle.x * 0.03) * 0.04;
      if (
        particle.x < MEMORY_LEFT - 28 ||
        particle.x > MEMORY_RIGHT + 28 ||
        particle.y < MEMORY_TOP - 28 ||
        particle.y > MEMORY_BOTTOM + 20
      ) {
        gs.particles[i] = makeMemoryDust();
      }
      continue;
    }

    if (particle.type === 'ring') {
      particle.size += 0.9;
      particle.life--;
    } else if (particle.type === 'mist' || particle.type === 'stability') {
      particle.x += particle.vx;
      particle.y += particle.vy - 0.08;
      particle.vx *= 0.94;
      particle.vy *= 0.92;
      particle.life--;
    } else {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.88;
      particle.vy *= 0.88;
      particle.life--;
    }

    if (particle.life <= 0) {
      gs.particles.splice(i, 1);
    }
  }
}

function updateChains(gs: GameState) {
  gs.chainEffects = gs.chainEffects.filter((effect) => {
    effect.timer--;
    return effect.timer > 0;
  });
}

function updateChoiceFlash(gs: GameState) {
  if (gs.choiceFlash > 0) {
    gs.choiceFlash--;
    if (gs.choiceFlash === 0) {
      gs.choiceTone = null;
    }
  }
}

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
  effect: DialogueChoiceEffect,
  onPhaseChange: (p: GameState['phase']) => void,
) {
  gs.awaitingChoice = false;
  gs.choiceFlash = 34;
  gs.dialogueActive = false;

  if (effect === 'memory-vulnerability') {
    gs.choiceTone = 'trust';
    gs.narrative.scene1Choice = 'vulnerability';
    gs.narrative.scene1BondVariant = 'stable';
    startDialogue(gs, MEMORY_DIALOGUE_VULNERABILITY);
    gs.lia.expression = 'neutral';
    spawnMemoryBond(gs, 'memory-bond-stable', 112);
    return;
  }

  if (effect === 'memory-burden') {
    gs.choiceTone = 'dependency';
    gs.narrative.scene1Choice = 'burden';
    gs.narrative.scene1BondVariant = 'strained';
    startDialogue(gs, MEMORY_DIALOGUE_BURDEN);
    gs.lia.expression = 'serious';
    spawnMemoryBond(gs, 'memory-bond-strained', 112);
    return;
  }

  if (effect === 'memory-lightness') {
    gs.choiceTone = 'intimacy';
    gs.narrative.scene1Choice = 'lightness';
    gs.narrative.scene1BondVariant = 'warm';
    startDialogue(gs, MEMORY_DIALOGUE_LIGHTNESS);
    gs.lia.expression = 'soft-smile';
    spawnMemoryBond(gs, 'memory-bond-warm', 112);
    return;
  }

  gs.chosenPath = effect;
  gs.choiceTone = effect;

  if (effect === 'trust') {
    gs.aiko.trust = Math.min(100, gs.aiko.trust + 25);
    gs.aiko.autonomy = Math.min(100, gs.aiko.autonomy + 10);
    startDialogue(gs, DIALOGUE_TRUST_RESULT);
  } else if (effect === 'dependency') {
    gs.aiko.dependency = Math.min(100, gs.aiko.dependency + 30);
    gs.aiko.autonomy = Math.max(0, gs.aiko.autonomy - 20);
    updateAikoState(gs.aiko);
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
  if (gs.phase === 'MEMORY_DIALOGUE') {
    gs.narrative.scene1Complete = true;
    gs.memory.outroTimer = 0;
    gs.memory.finalCaptionVisible = false;
    gs.memory.finalCaptionAlpha = 0;
    gs.memory.fadeAlpha = 0;
    setPhase(gs, 'MEMORY_OUTRO', onPhaseChange);
  } else if (gs.phase === 'DIALOGUE') {
    gs.phase = 'PRE_COMBAT';
    onPhaseChange('PRE_COMBAT');
    startDialogue(gs, DIALOGUE_PRE_COMBAT);
  } else if (gs.phase === 'PRE_COMBAT') {
    gs.phase = 'COMBAT';
    onPhaseChange('COMBAT');
  } else if (gs.phase === 'POST_COMBAT') {
    gs.phase = 'ENDING';
    onPhaseChange('ENDING');
    onGameEnd({
      dependency: gs.aiko.dependency,
      trust: gs.aiko.trust,
      autonomy: gs.aiko.autonomy,
      forcedChainCount: gs.player.forcedChainCount,
      chosenPath: gs.chosenPath,
      narrative: gs.narrative,
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
