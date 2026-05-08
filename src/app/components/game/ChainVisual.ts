import type { ChainEffect, Vec2 } from './types';

const TAU = Math.PI * 2;

export function drawChainVisual(
  ctx: CanvasRenderingContext2D,
  effect: ChainEffect,
  frame: number,
) {
  const alpha = effect.timer / effect.maxTimer;
  const points = buildArcPoints(
    { x: effect.fromX, y: effect.fromY },
    { x: effect.toX, y: effect.toY },
    14,
    0.09,
    frame,
    3,
  );

  ctx.save();
  strokePath(ctx, points, 6.2, `rgba(11, 8, 10, ${alpha * 0.58})`);

  for (let i = 0; i < points.length - 1; i++) {
    ctx.strokeStyle = `rgba(75, 60, 58, ${alpha * 0.84})`;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }

  for (let i = 0; i < points.length; i++) {
    const center = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const tangent = normalize({ x: next.x - prev.x, y: next.y - prev.y });
    drawLink(ctx, center, tangent, i % 2 === 0 ? 0 : Math.PI / 2, alpha, frame + i);
  }

  drawPulse(ctx, points[0], '#ff936f', alpha * 0.42, 12);
  drawPulse(ctx, points[points.length - 1], '#ffd8b9', alpha * 0.5, 15);
  ctx.restore();
}

function drawLink(
  ctx: CanvasRenderingContext2D,
  center: Vec2,
  tangent: Vec2,
  angleOffset: number,
  alpha: number,
  shimmerSeed: number,
) {
  const angle = Math.atan2(tangent.y, tangent.x) + angleOffset;
  const linkW = 11.4;
  const linkH = 6.6;

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);

  ctx.strokeStyle = `rgba(19, 13, 14, ${alpha * 0.86})`;
  ctx.lineWidth = 5.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, linkW * 0.5, linkH * 0.5, 0, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = `rgba(126, 117, 116, ${alpha * 0.88})`;
  ctx.lineWidth = 3.1;
  ctx.beginPath();
  ctx.ellipse(0, 0, linkW * 0.5, linkH * 0.5, 0, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 120, 90, ${alpha * (0.12 + (Math.sin(shimmerSeed * 0.2) + 1) * 0.05)})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(-1, -0.8, linkW * 0.33, linkH * 0.2, 0, Math.PI * 1.1, Math.PI * 1.92);
  ctx.stroke();

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
  const curve = Math.min(14, distance * curveFactor);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const base = {
      x: from.x + delta.x * t,
      y: from.y + delta.y * t,
    };
    const arch = Math.sin(t * Math.PI) * curve;
    const wave = Math.sin(frame * 0.15 + t * 6.8) * waveAmount * Math.sin(t * Math.PI);
    points.push({
      x: base.x + normal.x * (arch + wave),
      y: base.y + normal.y * (arch + wave),
    });
  }

  return points;
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
