import type { AikoStateType, EnemyAIState, Vec2 } from './types';
import type { CharacterDefinition } from './characterDefinitions';
import { getProceduralMotionProfile } from './ProceduralCharacterAnimator';

const TAU = Math.PI * 2;
const SCREEN_UP: Vec2 = { x: 0, y: -1 };

export interface CharacterMotionState {
  frame: number;
  facing: Vec2;
  velocity: Vec2;
  poseVariant?: 'default' | 'seated';
  storyBeat?: 'memory' | 'present';
  expression?: 'neutral' | 'soft-smile' | 'serious';
  isAttacking?: boolean;
  attackType?: 'light' | 'heavy' | null;
  attackTimer?: number;
  isDodging?: boolean;
  hitFlash?: number;
  castType?: 'bond' | 'forced' | null;
  dependency?: number;
  autonomy?: number;
  aikoState?: AikoStateType;
  enemyState?: EnemyAIState;
  seed?: number;
}

export interface CharacterRig {
  root: Vec2;
  hip: Vec2;
  chest: Vec2;
  head: Vec2;
  shoulders: [Vec2, Vec2];
  hips: [Vec2, Vec2];
  hands: [Vec2, Vec2];
  feet: [Vec2, Vec2];
  forward: Vec2;
  side: Vec2;
  bounce: number;
  shadowRadiusX: number;
  shadowRadiusY: number;
  anchors: {
    chest: Vec2;
    rightHand: Vec2;
    leftHand: Vec2;
    head: Vec2;
    target: Vec2;
    feet: Vec2;
  };
}

export function buildCharacterRig(
  definition: CharacterDefinition,
  root: Vec2,
  motion: CharacterMotionState,
): CharacterRig {
  const forward = normalizeOrDefault(motion.facing, { x: 1, y: 0 });
  const side = { x: -forward.y, y: forward.x };
  const velocityMag = Math.hypot(motion.velocity.x, motion.velocity.y);
  const travel = clamp(velocityMag / 3.4, 0, 1.4);
  const attackLean = motion.isAttacking ? (motion.attackType === 'heavy' ? 0.85 : 0.45) : 0;
  const dodgeLean = motion.isDodging ? 0.75 : 0;
  const seed = motion.seed ?? 0;
  const cycle = motion.frame * (0.11 + travel * 0.12) + seed * 0.6;
  const profile = getProceduralMotionProfile(definition, motion);
  const bounce = Math.sin(cycle * 2) * (0.7 + travel * 1.2) + profile.jitter + profile.breath;
  const torsoHeight = definition.silhouette.torsoHeight * definition.silhouette.scale;
  const legLength = definition.silhouette.legLength * definition.silhouette.scale;
  const armLength = definition.silhouette.armLength * definition.silhouette.scale;
  const shoulderWidth = definition.silhouette.shoulderWidth * definition.silhouette.scale;
  const hipWidth = definition.silhouette.hipWidth * definition.silhouette.scale;
  const stance = definition.silhouette.stanceWidth * definition.silhouette.scale;
  const seated = motion.poseVariant === 'seated';
  const baseHunch = definition.silhouette.hunch + profile.hunch + attackLean * 0.05;
  const lean = profile.forwardLean + attackLean + dodgeLean;
  const headLift = torsoHeight * (seated ? 0.56 : 0.68);
  const footLift = seated ? 0.5 : 1.4 + travel * 1.8;
  const stride = 4 + travel * 6 + profile.strideBoost;
  const leftStep = Math.sin(cycle) * stride;
  const rightStep = Math.sin(cycle + Math.PI) * stride;
  const armSwing = Math.sin(cycle + Math.PI * 0.5) * (2 + travel * 4);
  const jitterX = profile.jitter * Math.sin(motion.frame * 0.73 + seed * 1.2);
  const jitterY = profile.jitter * Math.cos(motion.frame * 0.81 + seed * 1.1);
  const rootWithJitter = add(root, { x: jitterX, y: jitterY });

  const hip = add(
    rootWithJitter,
    add(
      scale(SCREEN_UP, legLength * (seated ? 0.24 : 0.45)),
      scale(forward, -baseHunch * (seated ? 2.2 : 4)),
    ),
  );
  const chest = add(
    hip,
    add(
      scale(SCREEN_UP, torsoHeight * (seated ? 0.68 : 0.85) + profile.breath * 0.4),
      add(scale(forward, lean * 4), scale(side, profile.sideLean + profile.headTilt * 6)),
    ),
  );
  const head = add(
    chest,
    add(
      scale(SCREEN_UP, headLift + profile.breath * 0.55),
      add(scale(forward, -baseHunch * 2.4 + profile.headTilt * 4), scale(side, profile.headTilt * 8)),
    ),
  );

  const shoulders: [Vec2, Vec2] = [
    add(chest, add(scale(side, -shoulderWidth * 0.5), scale(forward, -1.2))),
    add(chest, add(scale(side, shoulderWidth * 0.5), scale(forward, 1.2))),
  ];
  const hips: [Vec2, Vec2] = [
    add(hip, scale(side, -hipWidth * 0.5)),
    add(hip, scale(side, hipWidth * 0.5)),
  ];

  const attackReach = motion.isAttacking
    ? (motion.attackType === 'heavy' ? 7 : 4.5) * (1 - (motion.attackTimer ?? 0) / (motion.attackType === 'heavy' ? 30 : 18))
    : 0;

  const hands: [Vec2, Vec2] = [
    add(
      shoulders[0],
      add(
        scale(side, -2 - profile.armGuard),
        add(scale(forward, armSwing * 0.6 - profile.armCross), scale(SCREEN_UP, armLength * 0.55)),
      ),
    ),
    add(
      shoulders[1],
      add(
        scale(side, 2 + profile.armGuard),
        add(scale(forward, -armSwing * 0.6 + profile.armCross + attackReach), scale(SCREEN_UP, armLength * 0.55)),
      ),
    ),
  ];

  const feet: [Vec2, Vec2] = [
    add(
      hips[0],
      add(
        scale(side, -stance * (seated ? 0.35 : 0.55)),
        add(
          scale(forward, seated ? -4 : leftStep * 0.45),
          scale(SCREEN_UP, footLift * Math.abs(Math.sin(cycle))),
        ),
      ),
    ),
    add(
      hips[1],
      add(
        scale(side, stance * (seated ? 0.35 : 0.55)),
        add(
          scale(forward, seated ? -2.2 : rightStep * 0.45),
          scale(SCREEN_UP, footLift * Math.abs(Math.sin(cycle + Math.PI))),
        ),
      ),
    ),
  ];

  return {
    root: rootWithJitter,
    hip,
    chest,
    head,
    shoulders,
    hips,
    hands,
    feet,
    forward,
    side,
    bounce,
    shadowRadiusX: 10 * definition.silhouette.scale + shoulderWidth * 0.7,
    shadowRadiusY: 5 * definition.silhouette.scale + stance * 0.35,
    anchors: {
      chest,
      rightHand: hands[1],
      leftHand: hands[0],
      head,
      target: add(chest, scale(forward, 8)),
      feet: rootWithJitter,
    },
  };
}

export function drawCharacterVisual(
  ctx: CanvasRenderingContext2D,
  definition: CharacterDefinition,
  rig: CharacterRig,
  motion: CharacterMotionState,
) {
  const flash = motion.hitFlash && motion.hitFlash > 0 && motion.frame % 2 === 0;
  const palette = definition.palette;
  const skin = flash ? '#fff6f0' : palette.skin;
  const coatPrimary = flash ? withAlpha('#ffffff', 0.85) : palette.outfitPrimary;
  const coatSecondary = flash ? withAlpha('#ffffff', 0.55) : palette.outfitSecondary;

  ctx.save();
  ctx.globalAlpha = motion.isDodging ? 0.72 + Math.sin(motion.frame * 0.4) * 0.15 : 1;

  drawShadow(ctx, rig, definition);
  drawAmbientAura(ctx, definition, rig, motion);
  drawLegs(ctx, definition, rig, skin, coatSecondary);
  drawLowerCostume(ctx, definition, rig, coatPrimary, coatSecondary);
  drawTorso(ctx, definition, rig, coatPrimary, coatSecondary);
  drawArms(ctx, definition, rig, skin, coatPrimary);
  drawHands(ctx, rig, skin);
  drawHead(ctx, definition, rig, skin);
  drawHair(ctx, definition, rig);
  drawFace(ctx, definition, rig, motion);
  drawDetails(ctx, definition, rig, motion);

  ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D, rig: CharacterRig, definition: CharacterDefinition) {
  ctx.save();
  ctx.fillStyle = withAlpha(definition.palette.shadow, 0.42);
  ctx.beginPath();
  ctx.ellipse(rig.root.x, rig.root.y + 5, rig.shadowRadiusX, rig.shadowRadiusY, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawAmbientAura(
  ctx: CanvasRenderingContext2D,
  definition: CharacterDefinition,
  rig: CharacterRig,
  motion: CharacterMotionState,
) {
  const auraStrength = definition.role === 'protagonist'
    ? (motion.storyBeat === 'memory' ? 0.08 : 0.3) + (1 - clamp((motion.attackTimer ?? 0) / 30, 0, 1)) * (motion.storyBeat === 'memory' ? 0.05 : 0.15)
    : definition.role === 'companion'
      ? 0.15 + clamp((motion.dependency ?? 0) / 100, 0, 1) * 0.18
      : definition.role === 'memory-anchor'
        ? 0.08
        : 0.16;

  ctx.save();
  ctx.shadowColor = definition.palette.glow;
  ctx.shadowBlur = 18;
  const chestGlow = ctx.createRadialGradient(rig.chest.x, rig.chest.y, 0, rig.chest.x, rig.chest.y, 22 * definition.silhouette.scale);
  chestGlow.addColorStop(0, withAlpha(definition.palette.glow, auraStrength));
  chestGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = chestGlow;
  ctx.beginPath();
  ctx.arc(rig.chest.x, rig.chest.y, 20 * definition.silhouette.scale, 0, TAU);
  ctx.fill();

  if (definition.role === 'companion' && motion.aikoState === 'unstable') {
    ctx.strokeStyle = withAlpha('#ffb6c9', 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(rig.head.x, rig.head.y - 2, 10, 0, Math.PI * (1.1 + Math.sin(motion.frame * 0.2) * 0.25));
    ctx.stroke();
  }
  ctx.restore();
}

function drawLegs(
  ctx: CanvasRenderingContext2D,
  definition: CharacterDefinition,
  rig: CharacterRig,
  skin: string,
  legColor: string,
) {
  const legWidth = 4.2 * definition.silhouette.scale;
  const bootWidth = 5.8 * definition.silhouette.scale;
  drawLimb(ctx, rig.hips[0], rig.feet[0], legWidth, legColor, withAlpha('#ffffff', 0.08));
  drawLimb(ctx, rig.hips[1], rig.feet[1], legWidth, legColor, withAlpha('#ffffff', 0.08));

  if (definition.costume.boots) {
    ctx.fillStyle = withAlpha('#0c111b', 0.96);
    drawFoot(ctx, rig.feet[0], rig.forward, bootWidth);
    drawFoot(ctx, rig.feet[1], rig.forward, bootWidth);
  } else {
    ctx.fillStyle = skin;
    drawFoot(ctx, rig.feet[0], rig.forward, bootWidth * 0.85);
    drawFoot(ctx, rig.feet[1], rig.forward, bootWidth * 0.85);
  }
}

function drawLowerCostume(
  ctx: CanvasRenderingContext2D,
  definition: CharacterDefinition,
  rig: CharacterRig,
  primary: string,
  secondary: string,
) {
  const hemY = rig.root.y - 3 + definition.silhouette.coatLength * 0.18;
  ctx.save();
  ctx.fillStyle = primary;
  ctx.beginPath();

  if (definition.costume.coatShape === 'split-coat') {
    ctx.moveTo(rig.hips[0].x - 3, rig.hip.y - 1);
    ctx.lineTo(rig.hips[1].x + 3, rig.hip.y - 1);
    ctx.lineTo(rig.root.x + 6, hemY + definition.silhouette.coatLength);
    ctx.lineTo(rig.root.x + 1.5, hemY + definition.silhouette.coatLength * 0.72);
    ctx.lineTo(rig.root.x - 1.5, hemY + definition.silhouette.coatLength * 0.72);
    ctx.lineTo(rig.root.x - 6, hemY + definition.silhouette.coatLength);
  } else if (definition.costume.coatShape === 'worn-dress') {
    ctx.moveTo(rig.hips[0].x - 3, rig.hip.y - 1);
    ctx.lineTo(rig.hips[1].x + 3, rig.hip.y - 1);
    ctx.lineTo(rig.root.x + 8, hemY + definition.silhouette.coatLength * 0.9);
    ctx.lineTo(rig.root.x, hemY + definition.silhouette.coatLength);
    ctx.lineTo(rig.root.x - 8, hemY + definition.silhouette.coatLength * 0.9);
  } else if (definition.costume.coatShape === 'rag-wraps') {
    ctx.moveTo(rig.hips[0].x - 3, rig.hip.y);
    ctx.lineTo(rig.hips[1].x + 2, rig.hip.y - 2);
    ctx.lineTo(rig.root.x + 7, hemY + definition.silhouette.coatLength * 0.66);
    ctx.lineTo(rig.root.x + 2, hemY + definition.silhouette.coatLength);
    ctx.lineTo(rig.root.x - 5, hemY + definition.silhouette.coatLength * 0.88);
  } else if (definition.costume.coatShape === 'brute-shell') {
    ctx.moveTo(rig.hips[0].x - 5, rig.hip.y - 2);
    ctx.lineTo(rig.hips[1].x + 5, rig.hip.y - 2);
    ctx.lineTo(rig.root.x + 8, hemY + definition.silhouette.coatLength * 0.75);
    ctx.lineTo(rig.root.x - 8, hemY + definition.silhouette.coatLength * 0.75);
  } else {
    ctx.moveTo(rig.hips[0].x - 3, rig.hip.y - 1);
    ctx.lineTo(rig.hips[1].x + 3, rig.hip.y - 1);
    ctx.lineTo(rig.root.x + 6, hemY + definition.silhouette.coatLength * 0.8);
    ctx.lineTo(rig.root.x - 6, hemY + definition.silhouette.coatLength * 0.8);
  }

  ctx.closePath();
  ctx.fill();

  if (definition.costume.skirtPanels) {
    ctx.strokeStyle = withAlpha(definition.palette.accent, 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rig.root.x, rig.hip.y + 3);
    ctx.lineTo(rig.root.x, hemY + definition.silhouette.coatLength * 0.9);
    ctx.stroke();
  }

  if (definition.costume.tornHem) {
    ctx.strokeStyle = withAlpha(secondary, 0.85);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rig.root.x - 6, hemY + definition.silhouette.coatLength * 0.8);
    ctx.lineTo(rig.root.x - 2, hemY + definition.silhouette.coatLength * 0.95);
    ctx.lineTo(rig.root.x + 3, hemY + definition.silhouette.coatLength * 0.72);
    ctx.lineTo(rig.root.x + 7, hemY + definition.silhouette.coatLength * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTorso(
  ctx: CanvasRenderingContext2D,
  definition: CharacterDefinition,
  rig: CharacterRig,
  primary: string,
  secondary: string,
) {
  ctx.save();
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.moveTo(rig.shoulders[0].x - 2, rig.shoulders[0].y);
  ctx.lineTo(rig.shoulders[1].x + 2, rig.shoulders[1].y);
  ctx.lineTo(rig.hips[1].x + 2, rig.hips[1].y + 2);
  ctx.lineTo(rig.hips[0].x - 2, rig.hips[0].y + 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = withAlpha(secondary, 0.9);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(rig.chest.x, rig.chest.y - 6);
  ctx.lineTo(rig.chest.x, rig.hip.y + 4);
  ctx.stroke();

  if (definition.costume.chainTrim) {
    ctx.strokeStyle = withAlpha(definition.palette.metal ?? definition.palette.accent, 0.75);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rig.shoulders[0].x + 3, rig.chest.y - 2);
    ctx.lineTo(rig.chest.x - 2, rig.chest.y + 2);
    ctx.lineTo(rig.shoulders[1].x - 2, rig.chest.y + 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArms(
  ctx: CanvasRenderingContext2D,
  definition: CharacterDefinition,
  rig: CharacterRig,
  skin: string,
  sleeveColor: string,
) {
  const armWidth = 4.2 * definition.silhouette.scale;
  drawLimb(ctx, rig.shoulders[0], rig.hands[0], armWidth, sleeveColor, withAlpha('#ffffff', 0.1));
  drawLimb(ctx, rig.shoulders[1], rig.hands[1], armWidth, sleeveColor, withAlpha('#ffffff', 0.1));

  if (definition.costume.bandages) {
    ctx.strokeStyle = withAlpha('#ead7c7', 0.8);
    ctx.lineWidth = 1.1;
    for (const hand of rig.hands) {
      ctx.beginPath();
      ctx.arc(hand.x - 1, hand.y - 2, 3.2, 0.4, 2.8);
      ctx.stroke();
    }
  }

  if (definition.costume.sleeveShape === 'torn') {
    ctx.strokeStyle = withAlpha(skin, 0.28);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rig.hands[0].x - 2, rig.hands[0].y - 2);
    ctx.lineTo(rig.hands[0].x + 2, rig.hands[0].y + 2);
    ctx.moveTo(rig.hands[1].x - 2, rig.hands[1].y - 2);
    ctx.lineTo(rig.hands[1].x + 2, rig.hands[1].y + 2);
    ctx.stroke();
  }
}

function drawHands(ctx: CanvasRenderingContext2D, rig: CharacterRig, skin: string) {
  ctx.save();
  ctx.fillStyle = skin;
  for (const hand of rig.hands) {
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 2.4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, definition: CharacterDefinition, rig: CharacterRig, skin: string) {
  ctx.save();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(
    rig.head.x,
    rig.head.y,
    definition.silhouette.headRadius * 0.92,
    definition.silhouette.headRadius * 1.05,
    0,
    0,
    TAU,
  );
  ctx.fill();
  ctx.restore();
}

function drawHair(ctx: CanvasRenderingContext2D, definition: CharacterDefinition, rig: CharacterRig) {
  const radius = definition.silhouette.headRadius;
  const volume = definition.silhouette.hairVolume;
  ctx.save();
  ctx.fillStyle = definition.palette.hair;
  ctx.beginPath();

  switch (definition.costume.hairShape) {
    case 'messy-mid':
      ctx.moveTo(rig.head.x - radius - 2, rig.head.y - 3);
      ctx.quadraticCurveTo(rig.head.x, rig.head.y - volume - 4, rig.head.x + radius + 2, rig.head.y - 2);
      ctx.lineTo(rig.head.x + 4, rig.head.y + 5);
      ctx.lineTo(rig.head.x + 1, rig.head.y + 2);
      ctx.lineTo(rig.head.x - 3, rig.head.y + 5);
      ctx.closePath();
      break;
    case 'soft-bob':
      ctx.moveTo(rig.head.x - radius - 2, rig.head.y - 2);
      ctx.quadraticCurveTo(rig.head.x, rig.head.y - volume - 2, rig.head.x + radius + 1, rig.head.y - 1);
      ctx.lineTo(rig.head.x + radius, rig.head.y + 5);
      ctx.quadraticCurveTo(rig.head.x, rig.head.y + 7, rig.head.x - radius, rig.head.y + 4);
      ctx.closePath();
      break;
    case 'ragged-fall':
      ctx.moveTo(rig.head.x - radius - 1, rig.head.y - 1);
      ctx.lineTo(rig.head.x - 2, rig.head.y - volume - 3);
      ctx.lineTo(rig.head.x + radius + 1, rig.head.y - 1);
      ctx.lineTo(rig.head.x + 5, rig.head.y + 5);
      ctx.lineTo(rig.head.x - 5, rig.head.y + 4);
      ctx.closePath();
      break;
    case 'spike-mass':
      ctx.moveTo(rig.head.x - radius - 1, rig.head.y + 1);
      ctx.lineTo(rig.head.x - 4, rig.head.y - volume - 3);
      ctx.lineTo(rig.head.x, rig.head.y - volume - 1);
      ctx.lineTo(rig.head.x + 4, rig.head.y - volume - 4);
      ctx.lineTo(rig.head.x + radius + 2, rig.head.y + 1);
      ctx.closePath();
      break;
    case 'short-bands':
      ctx.ellipse(rig.head.x, rig.head.y - 1, radius + 1, radius * 0.8, 0, Math.PI, TAU);
      break;
    case 'sleek-parted':
      ctx.moveTo(rig.head.x - radius - 1, rig.head.y - 1);
      ctx.quadraticCurveTo(rig.head.x + 1, rig.head.y - volume - 2, rig.head.x + radius + 1, rig.head.y + 1);
      ctx.lineTo(rig.head.x + 2, rig.head.y + 4);
      ctx.lineTo(rig.head.x - radius, rig.head.y + 2);
      ctx.closePath();
      break;
    case 'shadow-fringe':
      ctx.moveTo(rig.head.x - radius, rig.head.y);
      ctx.quadraticCurveTo(rig.head.x, rig.head.y - volume - 1, rig.head.x + radius, rig.head.y - 1);
      ctx.lineTo(rig.head.x + 2, rig.head.y + 4);
      ctx.lineTo(rig.head.x - 4, rig.head.y + 2);
      ctx.closePath();
      break;
  }

  ctx.fill();
  ctx.restore();
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  definition: CharacterDefinition,
  rig: CharacterRig,
  motion: CharacterMotionState,
) {
  ctx.save();
  ctx.fillStyle = definition.palette.eyes;
  const eyeY = rig.head.y - 1;
  const eyeSpread = 2.1;
  ctx.beginPath();
  ctx.ellipse(rig.head.x - eyeSpread, eyeY, 0.9, 1.2, 0, 0, TAU);
  ctx.ellipse(rig.head.x + eyeSpread, eyeY, 0.9, 1.2, 0, 0, TAU);
  ctx.fill();

  if (definition.role === 'enemy') {
    ctx.strokeStyle = withAlpha(definition.palette.glow, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rig.head.x - 4, rig.head.y + 3);
    ctx.lineTo(rig.head.x + 2, rig.head.y + 1 + Math.sin(motion.frame * 0.12) * 0.5);
    ctx.stroke();
  } else if (definition.role === 'companion' || definition.role === 'memory-anchor') {
    const smileCurve =
      motion.expression === 'soft-smile' ? [0.2, 2.95] :
      motion.expression === 'serious' ? [0.8, 2.35] :
      [0.42, 2.72];
    ctx.strokeStyle = withAlpha(definition.role === 'memory-anchor' ? '#8f5f4c' : '#6c4f5c', 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rig.head.x, rig.head.y + 3, 2.2, smileCurve[0], smileCurve[1]);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDetails(
  ctx: CanvasRenderingContext2D,
  definition: CharacterDefinition,
  rig: CharacterRig,
  motion: CharacterMotionState,
) {
  ctx.save();
  if (definition.role === 'protagonist') {
    const pulse = 0.5 + Math.sin(motion.frame * 0.18) * 0.2;
    const baseGlow = motion.storyBeat === 'memory' ? 0.12 : 0.45;
    const handGlow = motion.storyBeat === 'memory' ? 0.08 : 0.28;
    ctx.fillStyle = withAlpha(definition.palette.glow, baseGlow + pulse * (motion.storyBeat === 'memory' ? 0.06 : 0.2));
    ctx.beginPath();
    ctx.arc(rig.chest.x, rig.chest.y + 1, 2.6, 0, TAU);
    ctx.fill();

    for (const hand of rig.hands) {
      ctx.fillStyle = withAlpha(definition.palette.glow, handGlow + pulse * (motion.storyBeat === 'memory' ? 0.05 : 0.18));
      ctx.beginPath();
      ctx.arc(hand.x, hand.y, 1.6 + pulse * 0.8, 0, TAU);
      ctx.fill();
    }
  }

  if (definition.role === 'companion') {
    const dependencyGlow = clamp((motion.dependency ?? 0) / 100, 0, 1);
    if (dependencyGlow > 0.25) {
      ctx.strokeStyle = withAlpha('#ff8aa7', 0.35 + dependencyGlow * 0.25);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(rig.chest.x, rig.chest.y + 2, 9 + dependencyGlow * 4, 0, TAU * 0.72);
      ctx.stroke();
    }
  }

  if (definition.role === 'enemy') {
    ctx.strokeStyle = withAlpha(definition.palette.accent, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rig.chest.x - 6, rig.chest.y - 3);
    ctx.lineTo(rig.chest.x - 1, rig.chest.y + 5);
    ctx.lineTo(rig.chest.x + 5, rig.chest.y - 1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLimb(
  ctx: CanvasRenderingContext2D,
  from: Vec2,
  to: Vec2,
  width: number,
  color: string,
  highlight: string,
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.strokeStyle = highlight;
  ctx.lineWidth = Math.max(1, width * 0.28);
  ctx.beginPath();
  ctx.moveTo(from.x - 0.8, from.y - 1.4);
  ctx.lineTo(to.x - 0.8, to.y - 1.4);
  ctx.stroke();
  ctx.restore();
}

function drawFoot(ctx: CanvasRenderingContext2D, foot: Vec2, forward: Vec2, size: number) {
  const side = { x: -forward.y, y: forward.x };
  ctx.beginPath();
  ctx.moveTo(foot.x - side.x * size * 0.55, foot.y - side.y * size * 0.55);
  ctx.lineTo(foot.x + side.x * size * 0.55, foot.y + side.y * size * 0.55);
  ctx.lineTo(foot.x + forward.x * size * 0.9 + side.x * size * 0.3, foot.y + forward.y * size * 0.9 + side.y * size * 0.3);
  ctx.lineTo(foot.x + forward.x * size * 0.9 - side.x * size * 0.3, foot.y + forward.y * size * 0.9 - side.y * size * 0.3);
  ctx.closePath();
  ctx.fill();
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(v: Vec2, amount: number): Vec2 {
  return { x: v.x * amount, y: v.y * amount };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeOrDefault(value: Vec2, fallback: Vec2): Vec2 {
  const length = Math.hypot(value.x, value.y);
  if (length <= 0.0001) return fallback;
  return { x: value.x / length, y: value.y / length };
}

function withAlpha(color: string, alpha: number) {
  if (!color.startsWith('#') || (color.length !== 7 && color.length !== 4)) {
    return color;
  }

  const hex = color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
}
