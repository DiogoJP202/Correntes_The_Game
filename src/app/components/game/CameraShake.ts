import type { CameraState } from './types';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

export function addCameraShake(camera: CameraState, amount: number) {
  camera.shake = clamp(camera.shake + amount, 0, 18);
}

export function updateCameraShake(camera: CameraState, frame: number) {
  camera.shake = camera.shake * 0.86;
  if (camera.shake < 0.04) {
    camera.shake = 0;
  }

  const noiseA = Math.sin(frame * 0.73 + 0.2) + Math.cos(frame * 0.19 + 1.4);
  const noiseB = Math.cos(frame * 0.61 + 0.8) + Math.sin(frame * 0.28 + 2.2);
  camera.shakeX = noiseA * camera.shake * 0.8;
  camera.shakeY = noiseB * camera.shake * 0.55;
}

export function easeCameraValue(current: number, target: number, amount: number) {
  return lerp(current, target, amount);
}
