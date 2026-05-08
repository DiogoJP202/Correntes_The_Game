import type { CharacterRig } from './CharacterVisualBuilder';
import type { AikoStateType, EnemyType } from './types';

const TAU = Math.PI * 2;

function withAlpha(color: string, alpha: number) {
  if (!color.startsWith('#')) return color;
  const r = Number.parseInt(color.slice(1, 3), 16);
  const g = Number.parseInt(color.slice(3, 5), 16);
  const b = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

function drawPulse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, withAlpha(color, alpha));
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

export function drawProtagonistAuraVFX(
  ctx: CanvasRenderingContext2D,
  rig: CharacterRig,
  frame: number,
  stability: number,
  castType: 'bond' | 'forced' | null,
) {
  const castBoost = castType === 'forced' ? 0.35 : castType === 'bond' ? 0.2 : 0;
  const danger = Math.max(0, 1 - stability / 100);
  const pulse = 0.45 + Math.sin(frame * 0.18) * 0.16;

  ctx.save();
  drawPulse(ctx, rig.anchors.chest.x, rig.anchors.chest.y + 1, 18, '#79c6ff', pulse * 0.22 + castBoost * 0.2);
  drawPulse(ctx, rig.anchors.rightHand.x, rig.anchors.rightHand.y, 12, castType === 'forced' ? '#ff7b52' : '#8ed6ff', 0.18 + castBoost * 0.25);
  drawPulse(ctx, rig.anchors.leftHand.x, rig.anchors.leftHand.y, 10, '#89cbff', 0.12 + pulse * 0.12);

  if (danger > 0.35) {
    drawPulse(ctx, rig.anchors.chest.x, rig.anchors.chest.y + 2, 28 + danger * 18, '#ff6d66', danger * 0.18);
    ctx.strokeStyle = withAlpha('#ffab7d', danger * 0.42);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rig.anchors.chest.x, rig.anchors.chest.y, 12 + Math.sin(frame * 0.3) * 2, 0, Math.PI * (1.2 + danger));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawAikoAuraVFX(
  ctx: CanvasRenderingContext2D,
  rig: CharacterRig,
  frame: number,
  dependency: number,
  autonomy: number,
  state: AikoStateType,
) {
  const dependencyGlow = Math.max(0, dependency / 100);
  const autonomySoftness = autonomy / 100;
  const pulse = 0.5 + Math.sin(frame * 0.14) * 0.12;

  ctx.save();
  drawPulse(ctx, rig.anchors.chest.x, rig.anchors.chest.y, 16, '#ffbfd0', 0.08 + pulse * 0.08);

  if (dependencyGlow > 0.3) {
    drawPulse(ctx, rig.anchors.chest.x, rig.anchors.chest.y + 3, 20 + dependencyGlow * 16, '#ff86aa', 0.12 + dependencyGlow * 0.12);
  }
  if (state === 'unstable') {
    drawPulse(ctx, rig.anchors.head.x, rig.anchors.head.y - 2, 18, '#ffd2df', 0.12 + Math.sin(frame * 0.26) * 0.04);
  }
  if (state === 'conscious') {
    drawPulse(ctx, rig.anchors.chest.x, rig.anchors.chest.y, 22, '#b7e2ff', autonomySoftness * 0.08);
  }
  ctx.restore();
}

export function drawEnemyAuraVFX(
  ctx: CanvasRenderingContext2D,
  rig: CharacterRig,
  frame: number,
  type: EnemyType,
  hitFlash: number,
) {
  const pulse = 0.12 + Math.sin(frame * 0.12 + rig.root.x * 0.01) * 0.04;
  ctx.save();
  drawPulse(ctx, rig.anchors.chest.x, rig.anchors.chest.y + 4, type === 'heavy' ? 26 : 18, '#a42620', pulse + hitFlash * 0.01);
  if (type === 'heavy') {
    drawPulse(ctx, rig.anchors.head.x, rig.anchors.head.y, 14, '#ff7d58', 0.08 + hitFlash * 0.02);
  }
  ctx.restore();
}
