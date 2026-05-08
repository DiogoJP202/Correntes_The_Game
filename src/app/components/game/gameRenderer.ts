import { CHARACTER_DEFINITIONS, getEnemyDefinition } from './characterDefinitions';
import {
  buildCharacterRig,
  drawCharacterVisual,
} from './CharacterVisualBuilder';
import { drawBondVFXController } from './BondVFXController';
import {
  drawAikoAuraVFX,
  drawEnemyAuraVFX,
  drawProtagonistAuraVFX,
} from './AuraVFXController';
import { drawEmotionalInstabilityVFX } from './EmotionalInstabilityVFX';
import {
  resolveAikoLookDirection,
  resolvePlayerLookDirection,
} from './CharacterLookAt';
import type { CharacterRig } from './CharacterVisualBuilder';
import type { Enemy, GameState, Vec2 } from './types';
import {
  CANVAS_H,
  CANVAS_W,
  MEMORY_BOTTOM,
  MEMORY_CITY_LAYERS,
  MEMORY_CLOTH_LINES,
  MEMORY_LEFT,
  MEMORY_RIGHT,
  MEMORY_ROOFTOP_PROPS,
  MEMORY_TOP,
  NEON_LIGHTS,
  OBSTACLES,
  OVERHEAD_WIRES,
  PUDDLES,
  STEAM_VENTS,
  STREET_PROPS,
  WALL_BOTTOM,
  WALL_TOP,
} from './gameData';

const TAU = Math.PI * 2;

interface EnemyRigEntry {
  enemy: Enemy;
  rig: CharacterRig;
}

export function renderGame(ctx: CanvasRenderingContext2D, gs: GameState) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const memory = isMemoryPhase(gs.phase);

  const playerFacing = memory
    ? resolveMemoryPlayerFacing(gs)
    : resolvePlayerLookDirection(
        gs.player.pos,
        gs.player.facing,
        gs.aiko.pos,
        gs.enemies,
        gs.phase,
        gs.dialogueActive,
      );

  const playerRig = buildCharacterRig(CHARACTER_DEFINITIONS.ren, gs.player.pos, {
    frame: gs.frameCount,
    facing: playerFacing,
    velocity: gs.player.vel,
    storyBeat: memory ? 'memory' : 'present',
    poseVariant: gs.phase === 'MEMORY_DIALOGUE' || gs.phase === 'MEMORY_OUTRO' || gs.phase === 'MEMORY_APPROACH' ? 'seated' : 'default',
    isAttacking: gs.player.isAttacking,
    attackType: gs.player.attackType,
    attackTimer: gs.player.attackTimer,
    isDodging: gs.player.isDodging,
    hitFlash: gs.player.hitFlash,
    castType: gs.player.castType,
    seed: 1,
  });

  ctx.save();
  applyCameraTransform(ctx, gs);
  if (memory) {
    const liaFacing = resolveMemoryLiaFacing(gs);
    const liaRig = buildCharacterRig(CHARACTER_DEFINITIONS.lia, gs.lia.pos, {
      frame: gs.frameCount,
      facing: liaFacing,
      velocity: { x: 0, y: 0 },
      poseVariant: 'seated',
      storyBeat: 'memory',
      expression: gs.lia.expression,
      seed: 9,
    });

    drawMemoryBackdrop(ctx, gs.frameCount);
    drawMemoryCity(ctx, gs.frameCount);
    drawMemoryRooftop(ctx, gs.frameCount);
    drawChainEffects(ctx, gs);
    drawMemoryCharacters(ctx, gs, playerRig, liaRig, playerFacing, liaFacing);
    drawParticles(ctx, gs);
    drawMemoryForeground(ctx, gs.frameCount);
  } else {
    const aikoFacing = resolveAikoLookDirection(
      gs.aiko.pos,
      gs.player.pos,
      gs.enemies,
      gs.phase,
    );
    const aikoPoseVariant = gs.phase === 'EXPLORE' || gs.phase === 'DIALOGUE' || gs.phase === 'PRE_COMBAT'
      ? 'seated'
      : 'default';
    const aikoVelocity = {
      x: gs.aiko.targetPos.x - gs.aiko.pos.x,
      y: gs.aiko.targetPos.y - gs.aiko.pos.y,
    };
    const aikoRig = buildCharacterRig(CHARACTER_DEFINITIONS.aiko, gs.aiko.pos, {
      frame: gs.frameCount,
      facing: aikoFacing,
      velocity: aikoVelocity,
      poseVariant: aikoPoseVariant,
      dependency: gs.aiko.dependency,
      autonomy: gs.aiko.autonomy,
      aikoState: gs.aiko.state,
      storyBeat: 'present',
      seed: 2,
    });

    const enemyRigs: EnemyRigEntry[] = [];
    for (const enemy of gs.enemies) {
      if (enemy.aiState === 'dead' && enemy.deathTimer <= 0) continue;
      const definition = getEnemyDefinition(enemy.type);
      const facing = resolveEnemyFacing(enemy, gs.player.pos);
      const rig = buildCharacterRig(definition, enemy.pos, {
        frame: gs.frameCount,
        facing,
        velocity: enemy.vel,
        enemyState: enemy.aiState,
        hitFlash: enemy.hitFlash,
        storyBeat: 'present',
        seed: enemy.id,
      });
      enemyRigs.push({ enemy, rig });
    }

    drawBackdrop(ctx, gs.frameCount);
    drawSkyline(ctx);
    drawOverheadWires(ctx, gs.frameCount);
    drawWallGrime(ctx, gs.frameCount);
    drawNeons(ctx, gs.frameCount);
    drawSteamVents(ctx, gs.frameCount);
    drawWetGround(ctx, gs.frameCount);
    drawObstacles(ctx);
    drawStreetProps(ctx);
    drawBackRain(ctx, gs);
    drawChainEffects(ctx, gs);
    drawSceneCharacters(ctx, gs, playerRig, aikoRig, enemyRigs, playerFacing, aikoFacing);
    drawAttackWake(ctx, gs, playerRig, playerFacing);
    drawParticles(ctx, gs);
    drawForegroundMist(ctx, gs.frameCount);
  }
  ctx.restore();

  drawDialogueSpotlight(ctx, gs);
  if (!memory) {
    drawEmotionalInstabilityVFX(ctx, gs);
  }
  drawChoiceFlash(ctx, gs);
  drawVignette(ctx, memory);
  drawLetterboxBars(ctx, gs.camera.bars);
}

function applyCameraTransform(ctx: CanvasRenderingContext2D, gs: GameState) {
  ctx.translate(CANVAS_W * 0.5, CANVAS_H * 0.5);
  ctx.scale(gs.camera.zoom, gs.camera.zoom);
  ctx.translate(-gs.camera.x, -gs.camera.y);
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

function resolveMemoryPlayerFacing(gs: GameState) {
  if (gs.phase === 'MEMORY_DIALOGUE' || gs.phase === 'MEMORY_OUTRO' || gs.phase === 'MEMORY_APPROACH') {
    return normalize({
      x: gs.lia.pos.x - gs.player.pos.x,
      y: gs.lia.pos.y - gs.player.pos.y,
    });
  }
  return normalize(gs.player.facing);
}

function resolveMemoryLiaFacing(gs: GameState) {
  if (gs.phase === 'MEMORY_DIALOGUE' || gs.phase === 'MEMORY_OUTRO' || gs.phase === 'MEMORY_APPROACH') {
    return normalize({
      x: gs.player.pos.x - gs.lia.pos.x,
      y: gs.player.pos.y - gs.lia.pos.y,
    });
  }
  return normalize({
    x: 1,
    y: -0.15,
  });
}

function drawMemoryBackdrop(ctx: CanvasRenderingContext2D, frame: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, MEMORY_TOP + 20);
  sky.addColorStop(0, '#f7c48f');
  sky.addColorStop(0.34, '#e6a46f');
  sky.addColorStop(0.7, '#8a5b67');
  sky.addColorStop(1, '#483244');
  ctx.fillStyle = sky;
  ctx.fillRect(-40, -30, CANVAS_W + 80, MEMORY_TOP + 64);

  const haze = ctx.createRadialGradient(140, 72, 0, 140, 72, 180);
  haze.addColorStop(0, 'rgba(255, 218, 166, 0.55)');
  haze.addColorStop(1, 'transparent');
  ctx.fillStyle = haze;
  ctx.fillRect(-40, -20, CANVAS_W + 80, 160);

  for (let i = 0; i < 5; i++) {
    const y = 58 + i * 12;
    ctx.strokeStyle = `rgba(255, 220, 186, ${0.08 - i * 0.01})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-40, y);
    ctx.lineTo(CANVAS_W + 40, y + Math.sin(frame * 0.005 + i) * 6);
    ctx.stroke();
  }
}

function drawMemoryCity(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  for (const layer of MEMORY_CITY_LAYERS) {
    ctx.fillStyle = layer.color;
    ctx.globalAlpha = layer.alpha;
    for (const building of layer.buildings) {
      const y = MEMORY_TOP - building.h + Math.sin(frame * 0.002 + building.x * 0.01) * 1.5;
      ctx.fillRect(building.x, y, building.w, building.h);
    }
  }

  ctx.globalAlpha = 0.42;
  for (let i = 0; i < 28; i++) {
    const x = 20 + i * 30;
    const glow = ctx.createRadialGradient(x, MEMORY_TOP - 16, 0, x, MEMORY_TOP - 16, 16);
    glow.addColorStop(0, 'rgba(255, 211, 166, 0.18)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, MEMORY_TOP - 16, 10, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawMemoryRooftop(ctx: CanvasRenderingContext2D, frame: number) {
  const wall = ctx.createLinearGradient(0, MEMORY_TOP, 0, MEMORY_BOTTOM);
  wall.addColorStop(0, '#8f7e74');
  wall.addColorStop(0.46, '#7c6e67');
  wall.addColorStop(1, '#5a514d');
  ctx.fillStyle = wall;
  ctx.fillRect(MEMORY_LEFT - 24, MEMORY_TOP, MEMORY_RIGHT - MEMORY_LEFT + 48, MEMORY_BOTTOM - MEMORY_TOP + 20);

  const floor = ctx.createLinearGradient(0, MEMORY_TOP + 60, 0, MEMORY_BOTTOM + 30);
  floor.addColorStop(0, '#b39b8d');
  floor.addColorStop(0.55, '#8d7c73');
  floor.addColorStop(1, '#625a57');
  ctx.fillStyle = floor;
  ctx.fillRect(MEMORY_LEFT - 30, MEMORY_TOP + 40, MEMORY_RIGHT - MEMORY_LEFT + 60, MEMORY_BOTTOM - MEMORY_TOP + 50);

  ctx.strokeStyle = 'rgba(255, 242, 224, 0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MEMORY_LEFT - 12, MEMORY_TOP + 46);
  ctx.lineTo(MEMORY_RIGHT + 12, MEMORY_TOP + 46);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 44, 44, 0.52)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    const crackX = 150 + i * 88;
    ctx.beginPath();
    ctx.moveTo(crackX, MEMORY_BOTTOM - 48);
    ctx.lineTo(crackX + 12, MEMORY_BOTTOM - 40);
    ctx.lineTo(crackX - 4, MEMORY_BOTTOM - 24);
    ctx.stroke();
  }

  drawMemoryRailing(ctx);
  drawMemoryClothLines(ctx, frame);
  drawMemoryProps(ctx, frame);
}

function drawMemoryRailing(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = 'rgba(96, 74, 74, 0.88)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(606, 270);
  ctx.lineTo(828, 270);
  ctx.stroke();

  ctx.lineWidth = 2;
  for (let x = 614; x <= 822; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 270);
    ctx.lineTo(x, 340);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255, 226, 196, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(606, 276);
  ctx.lineTo(828, 276);
  ctx.stroke();
  ctx.restore();
}

function drawMemoryClothLines(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(92, 74, 74, 0.8)';
  ctx.lineWidth = 1.6;
  for (const wire of MEMORY_CLOTH_LINES) {
    ctx.beginPath();
    ctx.moveTo(wire.x1, wire.y1);
    const midX = (wire.x1 + wire.x2) * 0.5;
    const midY = Math.max(wire.y1, wire.y2) + wire.sag + Math.sin(frame * 0.02 + wire.x1 * 0.04) * 2.8;
    ctx.quadraticCurveTo(midX, midY, wire.x2, wire.y2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(214, 175, 145, 0.86)';
  ctx.fillRect(232, 122, 26, 14);
  ctx.fillRect(244, 124, 18, 10);
  ctx.fillStyle = 'rgba(196, 147, 114, 0.72)';
  ctx.fillRect(534, 118, 30, 16);
  ctx.restore();
}

function drawMemoryProps(ctx: CanvasRenderingContext2D, frame: number) {
  for (const prop of MEMORY_ROOFTOP_PROPS) {
    ctx.save();
    ctx.fillStyle = prop.tint;
    ctx.strokeStyle = 'rgba(248, 232, 220, 0.12)';
    ctx.lineWidth = 1.2;

    if (prop.kind === 'water-tank') {
      ctx.fillRect(prop.x, prop.y + 8, prop.w, prop.h - 8);
      ctx.beginPath();
      ctx.ellipse(prop.x + prop.w * 0.5, prop.y + 8, prop.w * 0.5, 8, 0, Math.PI, TAU);
      ctx.fill();
    } else if (prop.kind === 'stairwell') {
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
      ctx.fillStyle = 'rgba(214, 195, 182, 0.15)';
      ctx.fillRect(prop.x + 14, prop.y + 20, 30, 48);
    } else if (prop.kind === 'chair') {
      ctx.strokeStyle = prop.tint;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(prop.x + 8, prop.y + 10);
      ctx.lineTo(prop.x + 8, prop.y + prop.h);
      ctx.lineTo(prop.x + 22, prop.y + prop.h);
      ctx.moveTo(prop.x + 22, prop.y + 10);
      ctx.lineTo(prop.x + 22, prop.y + prop.h);
      ctx.moveTo(prop.x + 6, prop.y + 10);
      ctx.lineTo(prop.x + 24, prop.y + 10);
      ctx.moveTo(prop.x + 6, prop.y + 20);
      ctx.lineTo(prop.x + 24, prop.y + 20);
      ctx.stroke();
    } else if (prop.kind === 'backpack') {
      ctx.fillRect(prop.x, prop.y + 2, prop.w, prop.h - 2);
      ctx.beginPath();
      ctx.ellipse(prop.x + prop.w * 0.5, prop.y + 2, prop.w * 0.5, 4, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 235, 220, 0.14)';
      ctx.fillRect(prop.x + 6, prop.y + 4, prop.w - 12, 6);
    } else if (prop.kind === 'bottle') {
      ctx.fillRect(prop.x + 2, prop.y, prop.w - 4, prop.h - 6);
      ctx.fillRect(prop.x + 4, prop.y - 6, prop.w - 8, 6);
      ctx.globalAlpha = 0.28 + Math.sin(frame * 0.08) * 0.06;
      ctx.fillStyle = '#fff5d7';
      ctx.fillRect(prop.x + 4, prop.y + 4, 2, prop.h - 12);
    } else if (prop.kind === 'antenna') {
      ctx.fillRect(prop.x + 5, prop.y + 10, 4, prop.h - 10);
      ctx.beginPath();
      ctx.moveTo(prop.x + 7, prop.y + 12);
      ctx.lineTo(prop.x - 8, prop.y + 24);
      ctx.moveTo(prop.x + 7, prop.y + 22);
      ctx.lineTo(prop.x + 18, prop.y + 38);
      ctx.stroke();
    } else {
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
    }

    if (prop.kind !== 'chair' && prop.kind !== 'antenna') {
      ctx.strokeRect(prop.x, prop.y, prop.w, prop.h);
    }
    ctx.restore();
  }
}

function drawMemoryCharacters(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  playerRig: CharacterRig,
  liaRig: CharacterRig,
  playerFacing: Vec2,
  liaFacing: Vec2,
) {
  const drawables: { y: number; draw: () => void }[] = [
    {
      y: liaRig.anchors.feet.y,
      draw: () => {
        drawCharacterVisual(ctx, CHARACTER_DEFINITIONS.lia, liaRig, {
          frame: gs.frameCount,
          facing: liaFacing,
          velocity: { x: 0, y: 0 },
          poseVariant: 'seated',
          storyBeat: 'memory',
          expression: gs.lia.expression,
          seed: 9,
        });
      },
    },
    {
      y: playerRig.anchors.feet.y,
      draw: () => {
        drawCharacterVisual(ctx, CHARACTER_DEFINITIONS.ren, playerRig, {
          frame: gs.frameCount,
          facing: playerFacing,
          velocity: gs.player.vel,
          poseVariant: gs.phase === 'MEMORY_DIALOGUE' || gs.phase === 'MEMORY_OUTRO' || gs.phase === 'MEMORY_APPROACH' ? 'seated' : 'default',
          storyBeat: 'memory',
          expression: 'neutral',
          seed: 1,
        });
      },
    },
  ];

  drawables.sort((a, b) => a.y - b.y);
  for (const drawable of drawables) drawable.draw();
}

function drawMemoryForeground(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  const glow = ctx.createLinearGradient(0, MEMORY_TOP, 0, MEMORY_BOTTOM);
  glow.addColorStop(0, 'rgba(255, 198, 136, 0.02)');
  glow.addColorStop(1, 'rgba(50, 28, 20, 0.16)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, MEMORY_TOP, CANVAS_W, MEMORY_BOTTOM - MEMORY_TOP);

  for (let i = 0; i < 2; i++) {
    const x = 180 + i * 300 + Math.sin(frame * 0.01 + i) * 18;
    const gradient = ctx.createRadialGradient(x, 360, 0, x, 360, 120);
    gradient.addColorStop(0, 'rgba(255, 214, 182, 0.08)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, 360, 120, 34, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackdrop(ctx: CanvasRenderingContext2D, frame: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, WALL_TOP);
  sky.addColorStop(0, '#02030a');
  sky.addColorStop(1, '#060917');
  ctx.fillStyle = sky;
  ctx.fillRect(-60, -40, CANVAS_W + 120, WALL_TOP + 40);

  const wall = ctx.createLinearGradient(0, WALL_TOP, 0, WALL_BOTTOM);
  wall.addColorStop(0, '#090d18');
  wall.addColorStop(0.4, '#08101c');
  wall.addColorStop(1, '#060911');
  ctx.fillStyle = wall;
  ctx.fillRect(-40, WALL_TOP, CANVAS_W + 80, WALL_BOTTOM - WALL_TOP);

  const floor = ctx.createLinearGradient(0, WALL_TOP, 0, CANVAS_H);
  floor.addColorStop(0, '#05070d');
  floor.addColorStop(0.45, '#07121b');
  floor.addColorStop(1, '#03050a');
  ctx.fillStyle = floor;
  ctx.fillRect(-40, WALL_TOP, CANVAS_W + 80, CANVAS_H - WALL_TOP + 40);

  ctx.strokeStyle = 'rgba(40, 56, 86, 0.26)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-40, WALL_TOP);
  ctx.lineTo(CANVAS_W + 40, WALL_TOP);
  ctx.moveTo(-40, WALL_BOTTOM);
  ctx.lineTo(CANVAS_W + 40, WALL_BOTTOM);
  ctx.stroke();

  for (let x = -10; x < CANVAS_W + 40; x += 58) {
    ctx.strokeStyle = 'rgba(18, 24, 40, 0.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(frame * 0.01 + x * 0.04) * 2, WALL_TOP + 2);
    ctx.stroke();
  }
}

function drawSkyline(ctx: CanvasRenderingContext2D) {
  const buildings = [
    { x: 8, w: 94, h: 38 },
    { x: 92, w: 68, h: 28 },
    { x: 170, w: 112, h: 44 },
    { x: 292, w: 60, h: 32 },
    { x: 360, w: 82, h: 51 },
    { x: 462, w: 98, h: 36 },
    { x: 576, w: 72, h: 48 },
    { x: 666, w: 104, h: 34 },
    { x: 780, w: 88, h: 40 },
  ];

  ctx.save();
  ctx.fillStyle = '#050811';
  for (const building of buildings) {
    ctx.fillRect(building.x, WALL_TOP - building.h, building.w, building.h);
  }
  ctx.restore();
}

function drawOverheadWires(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(24, 32, 46, 0.8)';
  ctx.lineWidth = 1.4;
  for (const wire of OVERHEAD_WIRES) {
    ctx.beginPath();
    ctx.moveTo(wire.x1, wire.y1);
    const midX = (wire.x1 + wire.x2) * 0.5;
    const midY = Math.max(wire.y1, wire.y2) + wire.sag + Math.sin(frame * 0.02 + wire.x1) * 1.4;
    ctx.quadraticCurveTo(midX, midY, wire.x2, wire.y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWallGrime(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const x = 32 + i * 48;
    const y = WALL_TOP + ((i * 29) % 120);
    const drip = 8 + (i % 4) * 9 + Math.sin(frame * 0.03 + i) * 2;
    ctx.strokeStyle = `rgba(20, 26, 40, ${0.22 + (i % 3) * 0.05})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ((i % 2) === 0 ? -3 : 3), y + drip);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(112, 124, 54, 22);
  ctx.fillRect(612, 102, 74, 26);
  ctx.restore();
}

function drawNeons(ctx: CanvasRenderingContext2D, frame: number) {
  for (const neon of NEON_LIGHTS) {
    const flicker = 0.82 + 0.18 * Math.sin(frame * 0.08 + neon.x * 0.02);
    const yPos = neon.side === 'top' ? WALL_TOP - 7 : WALL_BOTTOM + 5;
    const baseX = neon.x - neon.w * 0.5;

    ctx.save();
    ctx.shadowColor = neon.color;
    ctx.shadowBlur = 26 * flicker;

    const strip = ctx.createLinearGradient(baseX, 0, baseX + neon.w, 0);
    strip.addColorStop(0, 'transparent');
    strip.addColorStop(0.3, `${neon.color}cc`);
    strip.addColorStop(0.7, `${neon.color}cc`);
    strip.addColorStop(1, 'transparent');
    ctx.fillStyle = strip;
    ctx.fillRect(baseX, yPos - 3, neon.w, 6);

    ctx.fillStyle = `${neon.color}55`;
    ctx.fillRect(baseX + 6, yPos - 16, neon.w - 12, 10);

    ctx.fillStyle = `${neon.color}cc`;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(neon.label, neon.x, yPos - 8);

    const coneStart = neon.side === 'top' ? WALL_TOP : WALL_BOTTOM;
    const cone = ctx.createRadialGradient(neon.x, coneStart, 0, neon.x, coneStart, 210);
    cone.addColorStop(0, `${neon.color}1d`);
    cone.addColorStop(1, 'transparent');
    ctx.fillStyle = cone;
    ctx.beginPath();
    const spread = 122;
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

function drawWetGround(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(30, 44, 62, 0.45)';
  ctx.lineWidth = 1.1;
  for (let x = 102; x < 820; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, WALL_TOP + 22);
    ctx.lineTo(x - 18, WALL_BOTTOM - 10);
    ctx.stroke();
  }

  for (const puddle of PUDDLES) {
    const reflection = ctx.createRadialGradient(puddle.x, puddle.y, 0, puddle.x, puddle.y, puddle.rx);
    reflection.addColorStop(0, 'rgba(55, 107, 180, 0.18)');
    reflection.addColorStop(0.55, 'rgba(18, 42, 86, 0.14)');
    reflection.addColorStop(1, 'rgba(4, 10, 22, 0)');
    ctx.fillStyle = reflection;
    ctx.beginPath();
    ctx.ellipse(puddle.x, puddle.y, puddle.rx, puddle.ry, -0.06, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = `rgba(168, 214, 255, ${0.08 + Math.sin(frame * 0.08 + puddle.x * 0.01) * 0.03})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(puddle.x, puddle.y, puddle.rx * 0.82, puddle.ry * 0.62, -0.06, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSteamVents(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  for (const vent of STEAM_VENTS) {
    const pulse = 0.12 + Math.sin(frame * 0.04 + vent.x) * 0.04;
    const plume = ctx.createRadialGradient(vent.x, vent.y, 0, vent.x, vent.y, vent.size * 3.6);
    plume.addColorStop(0, `rgba(180, 210, 255, ${pulse})`);
    plume.addColorStop(1, 'transparent');
    ctx.fillStyle = plume;
    ctx.beginPath();
    ctx.ellipse(vent.x, vent.y - 12, vent.size * 1.6, vent.size * 2.8, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawStreetProps(ctx: CanvasRenderingContext2D) {
  for (const prop of STREET_PROPS) {
    ctx.save();
    ctx.fillStyle = prop.tint;
    ctx.strokeStyle = 'rgba(95, 118, 140, 0.18)';
    ctx.lineWidth = 1.2;

    if (prop.kind === 'dumpster') {
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
      ctx.fillStyle = 'rgba(18, 34, 46, 0.88)';
      ctx.fillRect(prop.x + 4, prop.y - 10, prop.w - 8, 12);
    } else if (prop.kind === 'crate-stack') {
      ctx.fillRect(prop.x, prop.y + 18, prop.w, prop.h - 18);
      ctx.fillRect(prop.x + 10, prop.y, prop.w - 16, 22);
    } else if (prop.kind === 'barrel-pile') {
      ctx.beginPath();
      ctx.ellipse(prop.x + 12, prop.y + 28, 12, 24, 0, 0, TAU);
      ctx.ellipse(prop.x + 28, prop.y + 30, 12, 24, 0, 0, TAU);
      ctx.ellipse(prop.x + 20, prop.y + 14, 12, 20, 0, 0, TAU);
      ctx.fill();
    } else if (prop.kind === 'cables') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prop.x, prop.y + 4);
      ctx.lineTo(prop.x + prop.w, prop.y + 9);
      ctx.moveTo(prop.x + 8, prop.y + 12);
      ctx.lineTo(prop.x + prop.w - 2, prop.y + 16);
      ctx.stroke();
    } else {
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
    }

    ctx.strokeRect(prop.x, prop.y, prop.w, prop.h);
    ctx.restore();
  }
}

function drawObstacles(ctx: CanvasRenderingContext2D) {
  for (const obs of OBSTACLES) {
    ctx.save();
    ctx.shadowColor = '#18243b';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#101827';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.strokeStyle = '#30415c';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    ctx.restore();
  }
}

function drawBackRain(ctx: CanvasRenderingContext2D, gs: GameState) {
  ctx.save();
  ctx.lineWidth = 1;
  for (const particle of gs.particles) {
    if (particle.type !== 'rain') continue;
    const alpha = 0.12 + (particle.y / CANVAS_H) * 0.15;
    ctx.strokeStyle = `rgba(96, 150, 255, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(
      particle.x + particle.vx * (particle.elongation ?? 2.8),
      particle.y + particle.vy * (particle.elongation ?? 2.8),
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawSceneCharacters(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  playerRig: CharacterRig,
  aikoRig: CharacterRig,
  enemyRigs: EnemyRigEntry[],
  playerFacing: Vec2,
  aikoFacing: Vec2,
) {
  const drawables: { y: number; draw: () => void }[] = [
    {
      y: aikoRig.anchors.feet.y,
      draw: () => {
        drawAikoAuraVFX(ctx, aikoRig, gs.frameCount, gs.aiko.dependency, gs.aiko.autonomy, gs.aiko.state);
        drawCharacterVisual(ctx, CHARACTER_DEFINITIONS.aiko, aikoRig, {
          frame: gs.frameCount,
          facing: aikoFacing,
          velocity: { x: gs.aiko.targetPos.x - gs.aiko.pos.x, y: gs.aiko.targetPos.y - gs.aiko.pos.y },
          poseVariant: gs.phase === 'EXPLORE' || gs.phase === 'DIALOGUE' || gs.phase === 'PRE_COMBAT' ? 'seated' : 'default',
          dependency: gs.aiko.dependency,
          autonomy: gs.aiko.autonomy,
          aikoState: gs.aiko.state,
          seed: 2,
        });
      },
    },
    {
      y: playerRig.anchors.feet.y,
      draw: () => {
        drawProtagonistAuraVFX(ctx, playerRig, gs.frameCount, gs.player.stability, gs.player.castType);
        drawCharacterVisual(ctx, CHARACTER_DEFINITIONS.ren, playerRig, {
          frame: gs.frameCount,
          facing: playerFacing,
          velocity: gs.player.vel,
          isAttacking: gs.player.isAttacking,
          attackType: gs.player.attackType,
          attackTimer: gs.player.attackTimer,
          isDodging: gs.player.isDodging,
          hitFlash: gs.player.hitFlash,
          castType: gs.player.castType,
          seed: 1,
        });
      },
    },
  ];

  for (const entry of enemyRigs) {
    drawables.push({
      y: entry.rig.anchors.feet.y,
      draw: () => {
        ctx.save();
        if (entry.enemy.aiState === 'dead') {
          ctx.globalAlpha = entry.enemy.deathTimer / 44;
        }
        drawEnemyAuraVFX(ctx, entry.rig, gs.frameCount, entry.enemy.type, entry.enemy.hitFlash);
        drawCharacterVisual(ctx, getEnemyDefinition(entry.enemy.type), entry.rig, {
          frame: gs.frameCount,
          facing: resolveEnemyFacing(entry.enemy, gs.player.pos),
          velocity: entry.enemy.vel,
          enemyState: entry.enemy.aiState,
          hitFlash: entry.enemy.hitFlash,
          seed: entry.enemy.id,
        });
        drawEnemyStatus(ctx, entry.enemy, entry.rig);
        ctx.restore();
      },
    });
  }

  drawables.sort((a, b) => a.y - b.y);
  for (const drawable of drawables) {
    drawable.draw();
  }
}

function drawEnemyStatus(ctx: CanvasRenderingContext2D, enemy: Enemy, rig: CharacterRig) {
  if (enemy.aiState !== 'dead') {
    const barWidth = enemy.radius * 2.2;
    const hpRatio = enemy.health / enemy.maxHealth;
    const x = rig.anchors.head.x;
    const y = rig.anchors.head.y - 16;
    ctx.fillStyle = '#210707';
    ctx.fillRect(x - barWidth * 0.5, y, barWidth, 5.5);
    ctx.fillStyle = hpRatio > 0.5 ? '#ff5a33' : '#ff9a56';
    ctx.fillRect(x - barWidth * 0.5, y, barWidth * hpRatio, 5.5);
    ctx.strokeStyle = '#4f1d18';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(x - barWidth * 0.5, y, barWidth, 5.5);
  }

  if (enemy.aiState === 'stunned') {
    ctx.strokeStyle = 'rgba(255, 188, 104, 0.72)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(rig.anchors.head.x, rig.anchors.head.y - 4, 10 + Math.sin(enemy.stunTimer * 0.2) * 2, 0, TAU);
    ctx.stroke();
  } else if (enemy.slowTimer > 0) {
    ctx.strokeStyle = 'rgba(132, 220, 255, 0.5)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(rig.anchors.chest.x, rig.anchors.chest.y, 12, 0, TAU * (enemy.slowTimer / 150));
    ctx.stroke();
  }
}

function drawAttackWake(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  playerRig: CharacterRig,
  playerFacing: Vec2,
) {
  if (!gs.player.isAttacking || gs.player.attackTimer <= 0) return;

  const progress = 1 - gs.player.attackTimer / (gs.player.attackType === 'heavy' ? 32 : 18);
  const reach = gs.player.attackType === 'heavy' ? 50 : 38;
  const arcSize = gs.player.attackType === 'heavy' ? 1.12 : 0.82;
  const angle = Math.atan2(playerFacing.y, playerFacing.x);

  ctx.save();
  ctx.translate(playerRig.anchors.rightHand.x, playerRig.anchors.rightHand.y);
  ctx.rotate(angle);
  ctx.strokeStyle = gs.player.attackType === 'heavy'
    ? `rgba(255, 160, 102, ${0.75 - progress * 0.22})`
    : `rgba(129, 222, 255, ${0.8 - progress * 0.28})`;
  ctx.lineWidth = gs.player.attackType === 'heavy' ? 6 : 3.8;
  ctx.shadowColor = gs.player.attackType === 'heavy' ? '#ff9c5e' : '#8bdeff';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, reach, -arcSize, arcSize);
  ctx.stroke();
  ctx.restore();
}

function drawChainEffects(ctx: CanvasRenderingContext2D, gs: GameState) {
  for (const effect of gs.chainEffects) {
    drawBondVFXController(ctx, effect, gs.frameCount);
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, gs: GameState) {
  ctx.save();
  for (const particle of gs.particles) {
    if (particle.type === 'rain') continue;

    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.glow ?? (particle.type === 'spark' ? 12 : 8);

    if (particle.type === 'ring') {
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, TAU);
      ctx.stroke();
      continue;
    }

    if (particle.type === 'spark') {
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(
        particle.x + Math.cos(particle.rotation ?? 0) * (particle.elongation ?? 4),
        particle.y + Math.sin(particle.rotation ?? 0) * (particle.elongation ?? 4),
      );
      ctx.stroke();
      continue;
    }

    if (particle.type === 'mist' || particle.type === 'stability') {
      const radius = particle.type === 'stability' ? particle.size * 1.6 : particle.size * 2.4;
      const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius);
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, radius, 0, TAU);
      ctx.fill();
      continue;
    }

    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawForegroundMist(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  const haze = ctx.createLinearGradient(0, WALL_BOTTOM - 8, 0, CANVAS_H + 24);
  haze.addColorStop(0, 'rgba(16, 24, 36, 0)');
  haze.addColorStop(1, 'rgba(14, 22, 34, 0.46)');
  ctx.fillStyle = haze;
  ctx.fillRect(-20, WALL_BOTTOM - 8, CANVAS_W + 40, CANVAS_H - WALL_BOTTOM + 36);

  for (let i = 0; i < 3; i++) {
    const x = 120 + i * 300 + Math.sin(frame * 0.02 + i) * 10;
    const gradient = ctx.createRadialGradient(x, 402, 0, x, 402, 120);
    gradient.addColorStop(0, 'rgba(130, 170, 220, 0.04)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, 404, 100, 28, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawDialogueSpotlight(ctx: CanvasRenderingContext2D, gs: GameState) {
  if (!(gs.dialogueActive || gs.phase === 'PRE_COMBAT' || gs.phase === 'POST_COMBAT' || gs.phase === 'MEMORY_OUTRO')) return;

  const focus = Math.max(0.22, gs.camera.focusMix * 0.42);
  const gradient = ctx.createRadialGradient(
    CANVAS_W * 0.5,
    CANVAS_H * 0.54,
    40,
    CANVAS_W * 0.5,
    CANVAS_H * 0.54,
    320,
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, `rgba(2, 4, 10, ${focus * 0.28})`);
  gradient.addColorStop(1, `rgba(2, 4, 10, ${focus})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawChoiceFlash(ctx: CanvasRenderingContext2D, gs: GameState) {
  if (gs.choiceFlash <= 0 || !gs.choiceTone) return;

  const alpha = (gs.choiceFlash / 34) * 0.16;
  ctx.fillStyle = gs.choiceTone === 'dependency'
    ? `rgba(120, 22, 34, ${alpha})`
    : gs.choiceTone === 'intimacy'
      ? `rgba(156, 104, 52, ${alpha})`
      : `rgba(24, 68, 126, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawVignette(ctx: CanvasRenderingContext2D, memory: boolean) {
  const gradient = ctx.createRadialGradient(
    CANVAS_W * 0.5,
    CANVAS_H * 0.5,
    60,
    CANVAS_W * 0.5,
    CANVAS_H * 0.5,
    420,
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, memory ? 'rgba(34, 14, 8, 0.28)' : 'rgba(0,0,0,0.46)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawLetterboxBars(ctx: CanvasRenderingContext2D, height: number) {
  if (height <= 0.2) return;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
  ctx.fillRect(0, 0, CANVAS_W, height);
  ctx.fillRect(0, CANVAS_H - height, CANVAS_W, height);
}

function resolveEnemyFacing(enemy: Enemy, playerPos: Vec2) {
  if (Math.hypot(enemy.vel.x, enemy.vel.y) > 0.1) {
    return normalize({
      x: enemy.vel.x,
      y: enemy.vel.y,
    });
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
