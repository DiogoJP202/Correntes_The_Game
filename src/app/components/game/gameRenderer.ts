import { CHARACTER_DEFINITIONS, getEnemyDefinition } from './characterDefinitions';
import { buildCharacterRig, drawCharacterVisual } from './CharacterVisualBuilder';
import { drawBondThreadVisual, drawForcedChainVisual } from './bondVfx';
import type { Enemy, GameState, Vec2 } from './types';
import { CANVAS_H, CANVAS_W, NEON_LIGHTS, OBSTACLES, WALL_BOTTOM, WALL_TOP } from './gameData';

const TAU = Math.PI * 2;

export function renderGame(ctx: CanvasRenderingContext2D, gs: GameState) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawBackground(ctx);
  drawNeons(ctx, gs.frameCount);
  drawObstacles(ctx);
  drawRain(ctx, gs);
  drawStreetDecals(ctx, gs.frameCount);
  drawSceneCharacters(ctx, gs);
  drawAttackWake(ctx, gs);
  drawChainEffects(ctx, gs);
  drawHitParticlesAndSparks(ctx, gs);
  drawFloor(ctx);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#04050d';
  ctx.fillRect(0, 0, CANVAS_W, WALL_TOP);

  const floorGrad = ctx.createLinearGradient(0, WALL_TOP, 0, WALL_BOTTOM);
  floorGrad.addColorStop(0, '#090b16');
  floorGrad.addColorStop(0.55, '#07101a');
  floorGrad.addColorStop(1, '#060810');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, WALL_TOP, CANVAS_W, WALL_BOTTOM - WALL_TOP);

  ctx.fillStyle = '#04050d';
  ctx.fillRect(0, WALL_BOTTOM, CANVAS_W, CANVAS_H - WALL_BOTTOM);

  ctx.strokeStyle = '#1a1e30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, WALL_TOP);
  ctx.lineTo(CANVAS_W, WALL_TOP);
  ctx.moveTo(0, WALL_BOTTOM);
  ctx.lineTo(CANVAS_W, WALL_BOTTOM);
  ctx.stroke();

  ctx.strokeStyle = '#0d1020';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WALL_TOP);
    ctx.stroke();
  }
  for (let y = 15; y < WALL_TOP; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
}

function drawStreetDecals(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  const seams = [110, 250, 430, 615, 770];
  ctx.strokeStyle = 'rgba(26, 40, 56, 0.45)';
  ctx.lineWidth = 1.2;
  for (const x of seams) {
    ctx.beginPath();
    ctx.moveTo(x, WALL_TOP + 16);
    ctx.lineTo(x - 18, WALL_BOTTOM - 12);
    ctx.stroke();
  }

  const flicker = 0.18 + Math.sin(frame * 0.08) * 0.04;
  ctx.fillStyle = `rgba(48, 92, 130, ${flicker})`;
  ctx.beginPath();
  ctx.ellipse(505, 293, 108, 24, -0.08, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawFloor(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const puddles = [
    { x: 150, y: 350, rx: 55, ry: 18 },
    { x: 380, y: 280, rx: 70, ry: 20 },
    { x: 590, y: 380, rx: 45, ry: 14 },
    { x: 750, y: 200, rx: 35, ry: 12 },
  ];

  for (const puddle of puddles) {
    const gradient = ctx.createRadialGradient(puddle.x, puddle.y, 0, puddle.x, puddle.y, puddle.rx);
    gradient.addColorStop(0, 'rgba(30,50,100,0.18)');
    gradient.addColorStop(1, 'rgba(5,8,20,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(puddle.x, puddle.y, puddle.rx, puddle.ry, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawNeons(ctx: CanvasRenderingContext2D, frame: number) {
  for (const neon of NEON_LIGHTS) {
    const flicker = 0.85 + 0.15 * Math.sin(frame * 0.07 + neon.x);
    ctx.save();
    ctx.shadowColor = neon.color;
    ctx.shadowBlur = 25 * flicker;

    const yPos = neon.side === 'top' ? WALL_TOP - 6 : WALL_BOTTOM + 4;
    const lightGrad = ctx.createLinearGradient(neon.x - neon.w / 2, 0, neon.x + neon.w / 2, 0);
    lightGrad.addColorStop(0, 'transparent');
    lightGrad.addColorStop(0.3, `${neon.color}cc`);
    lightGrad.addColorStop(0.7, `${neon.color}cc`);
    lightGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(neon.x - neon.w / 2, yPos - 3, neon.w, 6);

    const coneY1 = neon.side === 'top' ? WALL_TOP : WALL_BOTTOM;
    const coneGrad = ctx.createRadialGradient(neon.x, coneY1, 0, neon.x, coneY1, 200);
    coneGrad.addColorStop(0, `${neon.color}18`);
    coneGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    const spread = 110;
    if (neon.side === 'top') {
      ctx.moveTo(neon.x, WALL_TOP);
      ctx.lineTo(neon.x - spread, WALL_BOTTOM);
      ctx.lineTo(neon.x + spread, WALL_BOTTOM);
    } else {
      ctx.moveTo(neon.x, WALL_BOTTOM);
      ctx.lineTo(neon.x - spread, WALL_TOP);
      ctx.lineTo(neon.x + spread, WALL_TOP);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawObstacles(ctx: CanvasRenderingContext2D) {
  for (const obs of OBSTACLES) {
    ctx.save();
    ctx.shadowColor = '#1a2040';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#111828';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    ctx.strokeStyle = '#3a4570';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y);
    ctx.lineTo(obs.x + obs.w, obs.y);
    ctx.moveTo(obs.x, obs.y);
    ctx.lineTo(obs.x, obs.y + obs.h);
    ctx.stroke();
    ctx.restore();
  }
}

function drawRain(ctx: CanvasRenderingContext2D, gs: GameState) {
  ctx.save();
  ctx.lineWidth = 1;
  for (const particle of gs.particles) {
    if (particle.type !== 'rain') continue;
    const alpha = 0.15 + (particle.y / CANVAS_H) * 0.15;
    ctx.strokeStyle = `rgba(100,150,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x + particle.vx * 2.5, particle.y + particle.vy * 2.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSceneCharacters(ctx: CanvasRenderingContext2D, gs: GameState) {
  const playerRig = buildCharacterRig(CHARACTER_DEFINITIONS.ren, gs.player.pos, {
    frame: gs.frameCount,
    facing: gs.player.facing,
    velocity: gs.player.vel,
    isAttacking: gs.player.isAttacking,
    attackType: gs.player.attackType,
    attackTimer: gs.player.attackTimer,
    isDodging: gs.player.isDodging,
    hitFlash: gs.player.hitFlash,
  });

  const aikoFacing = normalize({
    x: gs.player.pos.x - gs.aiko.pos.x,
    y: gs.player.pos.y - gs.aiko.pos.y,
  });
  const aikoVelocity = gs.phase === 'COMBAT'
    ? {
      x: gs.player.pos.x - gs.aiko.pos.x,
      y: gs.player.pos.y - gs.aiko.pos.y,
    }
    : { x: 0, y: 0 };
  const aikoPoseVariant = gs.phase === 'EXPLORE' || gs.phase === 'DIALOGUE' || gs.phase === 'PRE_COMBAT'
    ? 'seated'
    : 'default';
  const aikoRig = buildCharacterRig(CHARACTER_DEFINITIONS.aiko, gs.aiko.pos, {
    frame: gs.frameCount,
    facing: aikoFacing,
    velocity: aikoVelocity,
    poseVariant: aikoPoseVariant,
    dependency: gs.aiko.dependency,
    autonomy: gs.aiko.autonomy,
    aikoState: gs.aiko.state,
    seed: 2,
  });

  const drawables = [
    {
      y: aikoRig.anchors.feet.y,
      draw: () => drawCharacterVisual(ctx, CHARACTER_DEFINITIONS.aiko, aikoRig, {
        frame: gs.frameCount,
        facing: aikoFacing,
        velocity: aikoVelocity,
        poseVariant: aikoPoseVariant,
        dependency: gs.aiko.dependency,
        autonomy: gs.aiko.autonomy,
        aikoState: gs.aiko.state,
        seed: 2,
      }),
    },
    {
      y: playerRig.anchors.feet.y,
      draw: () => drawCharacterVisual(ctx, CHARACTER_DEFINITIONS.ren, playerRig, {
        frame: gs.frameCount,
        facing: gs.player.facing,
        velocity: gs.player.vel,
        isAttacking: gs.player.isAttacking,
        attackType: gs.player.attackType,
        attackTimer: gs.player.attackTimer,
        isDodging: gs.player.isDodging,
        hitFlash: gs.player.hitFlash,
      }),
    },
  ];

  for (const enemy of gs.enemies) {
    if (enemy.aiState === 'dead' && enemy.deathTimer <= 0) continue;
    const facing = resolveEnemyFacing(enemy, gs.player.pos);
    const definition = getEnemyDefinition(enemy.type);
    const rig = buildCharacterRig(definition, enemy.pos, {
      frame: gs.frameCount,
      facing,
      velocity: enemy.vel,
      enemyState: enemy.aiState,
      hitFlash: enemy.hitFlash,
      seed: enemy.id,
    });
    drawables.push({
      y: rig.anchors.feet.y,
      draw: () => {
        ctx.save();
        if (enemy.aiState === 'dead') {
          ctx.globalAlpha = enemy.deathTimer / 40;
        }
        drawCharacterVisual(ctx, definition, rig, {
          frame: gs.frameCount,
          facing,
          velocity: enemy.vel,
          enemyState: enemy.aiState,
          hitFlash: enemy.hitFlash,
          seed: enemy.id,
        });
        drawEnemyStatus(ctx, enemy, rig);
        ctx.restore();
      },
    });
  }

  drawables.sort((a, b) => a.y - b.y);
  for (const drawable of drawables) {
    drawable.draw();
  }
}

function drawEnemyStatus(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  rig: ReturnType<typeof buildCharacterRig>,
) {
  if (enemy.aiState !== 'dead') {
    const barWidth = enemy.radius * 2.15;
    const hpRatio = enemy.health / enemy.maxHealth;
    const x = rig.anchors.head.x;
    const y = rig.anchors.head.y - 16;
    ctx.fillStyle = '#220000';
    ctx.fillRect(x - barWidth / 2, y, barWidth, 5.5);
    ctx.fillStyle = hpRatio > 0.5 ? '#ff4a26' : '#ff8a3d';
    ctx.fillRect(x - barWidth / 2, y, barWidth * hpRatio, 5.5);
    ctx.strokeStyle = '#4a1812';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(x - barWidth / 2, y, barWidth, 5.5);
  }

  if (enemy.aiState === 'stunned') {
    ctx.strokeStyle = 'rgba(255, 194, 94, 0.72)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(rig.anchors.head.x, rig.anchors.head.y - 4, 9 + Math.sin(enemy.stunTimer * 0.2) * 2, 0, TAU);
    ctx.stroke();
  } else if (enemy.slowTimer > 0) {
    ctx.strokeStyle = 'rgba(138, 215, 255, 0.48)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(rig.anchors.chest.x, rig.anchors.chest.y, 11, 0, TAU * (enemy.slowTimer / 150));
    ctx.stroke();
  }
}

function drawAttackWake(ctx: CanvasRenderingContext2D, gs: GameState) {
  if (!gs.player.isAttacking || gs.player.attackTimer <= 0) return;

  const rig = buildCharacterRig(CHARACTER_DEFINITIONS.ren, gs.player.pos, {
    frame: gs.frameCount,
    facing: gs.player.facing,
    velocity: gs.player.vel,
    isAttacking: gs.player.isAttacking,
    attackType: gs.player.attackType,
    attackTimer: gs.player.attackTimer,
    isDodging: gs.player.isDodging,
  });

  const progress = 1 - gs.player.attackTimer / (gs.player.attackType === 'heavy' ? 30 : 18);
  const reach = gs.player.attackType === 'heavy' ? 48 : 38;
  const arcSize = gs.player.attackType === 'heavy' ? 1.1 : 0.78;
  const angle = Math.atan2(gs.player.facing.y, gs.player.facing.x);

  ctx.save();
  ctx.translate(rig.anchors.rightHand.x, rig.anchors.rightHand.y);
  ctx.rotate(angle);
  ctx.strokeStyle = gs.player.attackType === 'heavy'
    ? `rgba(255, 160, 90, ${0.78 - progress * 0.25})`
    : `rgba(116, 214, 255, ${0.8 - progress * 0.3})`;
  ctx.lineWidth = gs.player.attackType === 'heavy' ? 6 : 3.6;
  ctx.shadowColor = gs.player.attackType === 'heavy' ? '#ff8f42' : '#75d4ff';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, reach, -arcSize, arcSize);
  ctx.stroke();
  ctx.restore();
}

function drawChainEffects(ctx: CanvasRenderingContext2D, gs: GameState) {
  for (const chain of gs.chainEffects) {
    if (chain.type === 'bond') {
      drawBondThreadVisual(ctx, chain, gs.frameCount);
    } else {
      drawForcedChainVisual(ctx, chain, gs.frameCount);
    }
  }
}

function drawHitParticlesAndSparks(ctx: CanvasRenderingContext2D, gs: GameState) {
  ctx.save();
  for (const particle of gs.particles) {
    if (particle.type === 'rain') continue;
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.type === 'spark' ? 10 : 6;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function resolveEnemyFacing(enemy: Enemy, playerPos: Vec2) {
  if (Math.hypot(enemy.vel.x, enemy.vel.y) > 0.1) {
    return normalize(enemy.vel);
  }
  return normalize({
    x: playerPos.x - enemy.pos.x,
    y: playerPos.y - enemy.pos.y,
  });
}

function normalize(value: Vec2) {
  const length = Math.hypot(value.x, value.y);
  if (length <= 0.0001) return { x: 1, y: 0 };
  return { x: value.x / length, y: value.y / length };
}
