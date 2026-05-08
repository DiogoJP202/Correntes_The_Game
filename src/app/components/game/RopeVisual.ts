import type { ChainEffect, Vec2 } from './types';

const TAU = Math.PI * 2;

export function drawRopeVisual(
  ctx: CanvasRenderingContext2D,
  effect: ChainEffect,
  frame: number,
) {
  const alpha = effect.timer / effect.maxTimer;
  const points = buildArcPoints(
    { x: effect.fromX, y: effect.fromY },
    { x: effect.toX, y: effect.toY },
    20,
    0.25,
    frame,
    8,
  );

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  strokePath(ctx, points, 9.5, `rgba(61, 118, 164, ${alpha * 0.16})`);
  strokePath(ctx, points, 6.1, `rgba(94, 184, 255, ${alpha * 0.46})`);
  strokePath(ctx, points, 4.1, `rgba(197, 238, 255, ${alpha * 0.62})`);
  strokePath(ctx, points, 1.6, `rgba(246, 252, 255, ${alpha * 0.82})`);

  for (let i = 1; i < points.length - 1; i++) {
    const normal = getNormal(points[i - 1], points[i + 1]);
    const weaveSize = 1.7 + Math.sin(frame * 0.18 + i * 0.9) * 0.35;
    ctx.strokeStyle = `rgba(222, 247, 255, ${alpha * 0.4})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(points[i].x - normal.x * weaveSize, points[i].y - normal.y * weaveSize);
    ctx.lineTo(points[i].x + normal.x * weaveSize, points[i].y + normal.y * weaveSize);
    ctx.stroke();
  }

  for (let i = 2; i < points.length - 1; i += 2) {
    ctx.fillStyle = `rgba(130, 224, 255, ${alpha * 0.28})`;
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 1.2 + Math.sin(frame * 0.25 + i) * 0.22, 0, TAU);
    ctx.fill();
  }

  drawPulse(ctx, points[0], '#70d7ff', alpha * 0.5, 13);
  drawPulse(ctx, points[points.length - 1], '#f4fdff', alpha * 0.72, 10);
  ctx.restore();
}

function strokePath(ctx: CanvasRenderingContext2D, points: Vec2[], width: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawPulse(ctx: CanvasRenderingContext2D, point: Vec2, color: string, alpha: number, radius: number) {
  const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
  gradient.addColorStop(0, withAlpha(color, alpha));
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, TAU);
  ctx.fill();
}

function buildArcPoints(
  from: Vec2,
  to: Vec2,
  segments: number,
  curveFactor: number,
  frame: number,
  waveAmount: number,
) {
  const points: Vec2[] = [];
  const delta = { x: to.x - from.x, y: to.y - from.y };
  const distance = Math.max(1, Math.hypot(delta.x, delta.y));
  const tangent = normalize(delta);
  const normal = { x: -tangent.y, y: tangent.x };
  const curve = Math.min(22, distance * curveFactor);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const base = {
      x: from.x + delta.x * t,
      y: from.y + delta.y * t,
    };
    const arch = Math.sin(t * Math.PI) * curve;
    const wave = Math.sin(frame * 0.16 + t * 8.8) * waveAmount * Math.sin(t * Math.PI);
    points.push({
      x: base.x + normal.x * (arch + wave),
      y: base.y + normal.y * (arch + wave),
    });
  }

  return points;
}

function getNormal(prev: Vec2, next: Vec2) {
  const tangent = normalize({ x: next.x - prev.x, y: next.y - prev.y });
  return { x: -tangent.y, y: tangent.x };
}

function normalize(value: Vec2) {
  const length = Math.hypot(value.x, value.y);
  if (length <= 0.0001) {
    return { x: 1, y: 0 };
  }
  return { x: value.x / length, y: value.y / length };
}

function withAlpha(color: string, alpha: number) {
  if (!color.startsWith('#')) return color;
  const r = Number.parseInt(color.slice(1, 3), 16);
  const g = Number.parseInt(color.slice(3, 5), 16);
  const b = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}
