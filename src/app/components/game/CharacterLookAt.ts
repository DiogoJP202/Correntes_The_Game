import type { Enemy, GamePhase, Vec2 } from './types';

function normalize(value: Vec2, fallback: Vec2 = { x: 1, y: 0 }) {
  const length = Math.hypot(value.x, value.y);
  if (length <= 0.0001) return fallback;
  return { x: value.x / length, y: value.y / length };
}

function nearestThreat(origin: Vec2, enemies: Enemy[]) {
  let best: Enemy | null = null;
  let bestDist = Infinity;

  for (const enemy of enemies) {
    if (enemy.aiState === 'dead') continue;
    const distance = Math.hypot(enemy.pos.x - origin.x, enemy.pos.y - origin.y);
    if (distance < bestDist) {
      bestDist = distance;
      best = enemy;
    }
  }

  return best;
}

export function resolvePlayerLookDirection(
  playerPos: Vec2,
  fallbackFacing: Vec2,
  aikoPos: Vec2,
  enemies: Enemy[],
  phase: GamePhase,
  dialogueActive: boolean,
) {
  if (dialogueActive || phase === 'PRE_COMBAT' || phase === 'POST_COMBAT') {
    return normalize({ x: aikoPos.x - playerPos.x, y: aikoPos.y - playerPos.y }, fallbackFacing);
  }

  const threat = nearestThreat(playerPos, enemies);
  if (phase === 'COMBAT' && threat) {
    return normalize({ x: threat.pos.x - playerPos.x, y: threat.pos.y - playerPos.y }, fallbackFacing);
  }

  return normalize(fallbackFacing, { x: 1, y: 0 });
}

export function resolveAikoLookDirection(
  aikoPos: Vec2,
  playerPos: Vec2,
  enemies: Enemy[],
  phase: GamePhase,
) {
  const threat = nearestThreat(aikoPos, enemies);
  if (phase === 'COMBAT' && threat) {
    const threatDist = Math.hypot(threat.pos.x - aikoPos.x, threat.pos.y - aikoPos.y);
    if (threatDist < 170) {
      return normalize({ x: playerPos.x - aikoPos.x, y: playerPos.y - aikoPos.y }, { x: -1, y: 0 });
    }
  }

  return normalize({ x: playerPos.x - aikoPos.x, y: playerPos.y - aikoPos.y }, { x: -1, y: 0 });
}
