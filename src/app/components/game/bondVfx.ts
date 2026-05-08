import type { ChainEffect, Vec2 } from './types';

const TAU = Math.PI * 2;

export function drawBondThreadVisual(
  ctx: CanvasRenderingContext2D,
  effect: ChainEffect,
  frame: number,
) {
  const alpha = effect.timer / effect.maxTimer;
  const points = buildArcPoints(
    { x: effect.fromX, y: effect.fromY },
    { x: effect.toX, y: effect.toY },
    18,
    0.22,
    frame,
    7,
  );

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  drawRibbon(ctx, points, 8, `rgba(96, 186, 255, ${alpha * 0.18})`);
  drawRibbon(ctx, points, 5.3, `rgba(154, 220, 255, ${alpha * 0.72})`);
  drawRibbon(ctx, points, 2.2, `rgba(235, 251, 255, ${alpha * 0.85})`);

  for (let i = 1; i < points.length - 1; i += 2) {
    const normal = getNormal(points[i - 1], points[i + 1]);
    const size = 2.8 + Math.sin(frame * 0.16 + i) * 0.4;
    ctx.strokeStyle = `rgba(182, 232, 255, ${alpha * 0.65})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(points[i].x - normal.x * size, points[i].y - normal.y * size);
    ctx.lineTo(points[i].x + normal.x * size, points[i].y + normal.y * size);
    ctx.stroke();
  }

  for (let i = 2; i < points.length - 1; i += 3) {
    ctx.fillStyle = `rgba(142, 224, 255, ${alpha * 0.32})`;
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 1.4 + Math.sin(frame * 0.2 + i) * 0.3, 0, TAU);
    ctx.fill();
  }

  drawEndPulse(ctx, points[0], '#72cfff', alpha * 0.6, 12);
  drawEndPulse(ctx, points[points.length - 1], '#dff8ff', alpha * 0.7, 10);
  ctx.restore();
}

export function drawForcedChainVisual(
  ctx: CanvasRenderingContext2D,
  effect: ChainEffect,
  frame: number,
) {
  const alpha = effect.timer / effect.maxTimer;
  const points = buildArcPoints(
    { x: effect.fromX, y: effect.fromY },
    { x: effect.toX, y: effect.toY },
    13,
    0.08,
    frame,
    3,
  );

  ctx.save();
  drawRibbon(ctx, points, 5.5, `rgba(24, 12, 10, ${alpha * 0.55})`);

  for (let i = 0; i < points.length - 1; i++) {
    const next = points[i + 1];
    const current = points[i];
    ctx.strokeStyle = `rgba(58, 44, 39, ${alpha * 0.78})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(current.x, current.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
  }

  for (let i = 0; i < points.length; i++) {
    const center = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const tangent = normalize({
      x: next.x - prev.x,
      y: next.y - prev.y,
    });
    drawChainLink(ctx, center, tangent, i % 2 === 0 ? 0 : Math.PI / 2, alpha, frame + i);
  }

  drawEndPulse(ctx, points[0], '#f2996f', alpha * 0.45, 11);
  drawEndPulse(ctx, points[points.length - 1], '#ffd8b0', alpha * 0.5, 14);
  ctx.restore();
}

function drawRibbon(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  width: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawChainLink(
  ctx: CanvasRenderingContext2D,
  center: Vec2,
  tangent: Vec2,
  angleOffset: number,
  alpha: number,
  shimmerSeed: number,
) {
  const angle = Math.atan2(tangent.y, tangent.x) + angleOffset;
  const linkW = 10.8;
  const linkH = 6.2;

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);

  ctx.strokeStyle = `rgba(39, 31, 28, ${alpha * 0.78})`;
  ctx.lineWidth = 5.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, linkW * 0.5, linkH * 0.5, 0, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = `rgba(133, 123, 118, ${alpha * 0.9})`;
  ctx.lineWidth = 3.1;
  ctx.beginPath();
  ctx.ellipse(0, 0, linkW * 0.5, linkH * 0.5, 0, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 230, 208, ${alpha * (0.14 + (Math.sin(shimmerSeed * 0.19) + 1) * 0.07)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-1.4, -1, linkW * 0.34, linkH * 0.22, 0, Math.PI * 1.1, Math.PI * 1.88);
  ctx.stroke();
  ctx.restore();
}

function drawEndPulse(
  ctx: CanvasRenderingContext2D,
  point: Vec2,
  color: string,
  alpha: number,
  radius: number,
) {
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
  const curve = Math.min(18, distance * curveFactor);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const base = {
      x: from.x + delta.x * t,
      y: from.y + delta.y * t,
    };
    const arch = Math.sin(t * Math.PI) * curve;
    const wave = Math.sin(frame * 0.15 + t * 8.5) * waveAmount * Math.sin(t * Math.PI);
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
