import type { ChainEffect } from './types';
import { drawChainVisual } from './ChainVisual';
import { drawRopeVisual } from './RopeVisual';

export function drawBondVFXController(
  ctx: CanvasRenderingContext2D,
  effect: ChainEffect,
  frame: number,
) {
  if (effect.type === 'bond') {
    drawRopeVisual(ctx, effect, frame);
  } else {
    drawChainVisual(ctx, effect, frame);
  }
}
