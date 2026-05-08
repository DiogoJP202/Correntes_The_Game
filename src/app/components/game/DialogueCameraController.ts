import { easeCameraValue, updateCameraShake } from './CameraShake';
import type { GameState, Vec2 } from './types';

function midpoint(a: Vec2, b: Vec2): Vec2 {
  return {
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function nearestEnemyToPlayer(gs: GameState) {
  let best = null as GameState['enemies'][number] | null;
  let bestDist = Infinity;
  for (const enemy of gs.enemies) {
    if (enemy.aiState === 'dead') continue;
    const dx = enemy.pos.x - gs.player.pos.x;
    const dy = enemy.pos.y - gs.player.pos.y;
    const distance = Math.hypot(dx, dy);
    if (distance < bestDist) {
      bestDist = distance;
      best = enemy;
    }
  }
  return best;
}

export function updateDialogueCameraController(gs: GameState) {
  const camera = gs.camera;
  updateCameraShake(camera, gs.frameCount);

  let target = { x: gs.player.pos.x, y: gs.player.pos.y - 18 };
  let zoom = 1.02;
  let bars = 0;
  let focusMix = 0.22;

  if (gs.phase === 'INTRO') {
    target = { x: 420, y: 250 };
    zoom = 1.08;
    bars = 18;
    focusMix = 0.35;
  } else if (gs.phase === 'EXPLORE') {
    if (gs.nearAiko) {
      target = midpoint(gs.player.pos, gs.aiko.pos);
      target.y -= 12;
      zoom = 1.05;
      bars = 8;
    }
  } else if (gs.phase === 'DIALOGUE' || gs.phase === 'PRE_COMBAT' || gs.phase === 'POST_COMBAT') {
    const line = gs.dialogueQueue[gs.dialogueIndex];
    const duo = midpoint(gs.player.pos, gs.aiko.pos);
    target = { x: duo.x, y: duo.y - 24 };
    zoom = gs.phase === 'POST_COMBAT' ? 1.18 : 1.14;
    bars = 26;
    focusMix = 0.7;

    if (line?.speaker === 'Aiko') {
      target.x = easeCameraValue(target.x, gs.aiko.pos.x + 16, 0.28);
    } else if (line?.speaker === 'Ren') {
      target.x = easeCameraValue(target.x, gs.player.pos.x - 14, 0.28);
    }
  } else if (gs.phase === 'COMBAT') {
    const threat = nearestEnemyToPlayer(gs);
    if (threat) {
      target = midpoint(gs.player.pos, threat.pos);
      target.y -= 18;
      zoom = threat.type === 'heavy' ? 1.08 : 1.05;
      focusMix = 0.44;
    }

    if (gs.player.castType === 'forced' && gs.player.castTimer > 0) {
      zoom += 0.05;
      bars = 12;
    }
    if (gs.player.stability < 35) {
      zoom += 0.02;
      bars = Math.max(bars, 10);
    }
  }

  camera.targetX = clamp(target.x, 150, 750);
  camera.targetY = clamp(target.y, 165, 320);
  camera.targetZoom = clamp(zoom, 0.98, 1.2);
  camera.focusMix = easeCameraValue(camera.focusMix, focusMix, 0.08);
  camera.bars = easeCameraValue(camera.bars, bars, 0.12);

  camera.x = easeCameraValue(camera.x, camera.targetX + camera.shakeX, 0.12);
  camera.y = easeCameraValue(camera.y, camera.targetY + camera.shakeY, 0.12);
  camera.zoom = easeCameraValue(camera.zoom, camera.targetZoom, 0.08);
}
