import { CANVAS_H, CANVAS_W } from './gameData';
import type { GameState } from './types';

const TAU = Math.PI * 2;

function withAlpha(color: string, alpha: number) {
  if (!color.startsWith('#')) return color;
  const r = Number.parseInt(color.slice(1, 3), 16);
  const g = Number.parseInt(color.slice(3, 5), 16);
  const b = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

export function drawEmotionalInstabilityVFX(ctx: CanvasRenderingContext2D, gs: GameState) {
  const stabilityDanger = Math.max(0, 1 - gs.player.stability / 100);
  const dependencyDanger = Math.max(0, gs.aiko.dependency / 100);

  if (stabilityDanger <= 0.18 && dependencyDanger <= 0.28) {
    return;
  }

  ctx.save();

  if (stabilityDanger > 0.18) {
    const alpha = stabilityDanger * 0.32;
    const gradient = ctx.createRadialGradient(
      CANVAS_W * 0.5,
      CANVAS_H * 0.56,
      30,
      CANVAS_W * 0.5,
      CANVAS_H * 0.56,
      320,
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.68, withAlpha('#21050c', alpha * 0.4));
    gradient.addColorStop(1, withAlpha('#490813', alpha));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.strokeStyle = withAlpha('#ff8f7f', alpha * 0.6);
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 4; i++) {
      const y = 72 + i * 106 + Math.sin(gs.frameCount * 0.08 + i * 1.4) * 6;
      ctx.beginPath();
      ctx.moveTo(18, y);
      ctx.lineTo(CANVAS_W - 18, y + Math.sin(gs.frameCount * 0.12 + i) * 4);
      ctx.stroke();
    }
  }

  if (dependencyDanger > 0.28) {
    ctx.strokeStyle = withAlpha('#ff96b5', 0.1 + dependencyDanger * 0.08);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(CANVAS_W * 0.86, 76, 28 + Math.sin(gs.frameCount * 0.12) * 3, 0, Math.PI * 1.6);
    ctx.stroke();
  }

  ctx.restore();
}
