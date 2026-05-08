import type { GameState, ParticleType } from './types';

function spawnBurst(gs: GameState, x: number, y: number, color: string, count: number, type: ParticleType) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 4.2;
    gs.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (type === 'mist' ? 0.8 : 0),
      life: type === 'mist' ? 34 : 24,
      maxLife: type === 'mist' ? 34 : 24,
      type,
      color,
      size: type === 'ring' ? 3.5 : 2 + Math.random() * 3,
      rotation: angle,
      elongation: type === 'spark' ? 1.8 + Math.random() * 2.4 : 1,
      glow: type === 'spark' ? 12 : 6,
    });
  }
}

export function spawnBondImpactVFX(gs: GameState, x: number, y: number) {
  spawnBurst(gs, x, y, '#79d4ff', 10, 'spark');
  spawnBurst(gs, x, y, '#dff8ff', 4, 'aura');
  gs.particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 20,
    maxLife: 20,
    type: 'ring',
    color: '#9ce6ff',
    size: 10,
    glow: 14,
  });
}

export function spawnForcedImpactVFX(gs: GameState, x: number, y: number) {
  spawnBurst(gs, x, y, '#ff784b', 12, 'spark');
  spawnBurst(gs, x, y, '#ffc4a8', 6, 'dust');
  gs.particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 24,
    maxLife: 24,
    type: 'ring',
    color: '#ff8e66',
    size: 13,
    glow: 18,
  });
}

export function spawnHeavyAttackVFX(gs: GameState, x: number, y: number) {
  spawnBurst(gs, x, y, '#ff9f6b', 8, 'dust');
  gs.particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 18,
    maxLife: 18,
    type: 'ring',
    color: '#ffc69d',
    size: 11,
    glow: 10,
  });
}

export function spawnStabilityLeakVFX(gs: GameState, x: number, y: number) {
  spawnBurst(gs, x, y, '#ff7c86', 3, 'stability');
}
