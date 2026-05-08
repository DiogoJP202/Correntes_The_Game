import type { CharacterDefinition } from './characterDefinitions';
import type { CharacterMotionState } from './CharacterVisualBuilder';

export interface MotionProfile {
  hunch: number;
  forwardLean: number;
  sideLean: number;
  armGuard: number;
  armCross: number;
  strideBoost: number;
  jitter: number;
  breath: number;
  headTilt: number;
  coatFlutter: number;
}

export function getProceduralMotionProfile(
  definition: CharacterDefinition,
  motion: CharacterMotionState,
): MotionProfile {
  let hunch = 0;
  let forwardLean = 0;
  let sideLean = 0;
  let armGuard = 0;
  let armCross = 0;
  let strideBoost = 0;
  let jitter = 0;
  let breath = Math.sin(motion.frame * 0.08 + (motion.seed ?? 0) * 0.5) * 0.55;
  let headTilt = Math.sin(motion.frame * 0.05 + (motion.seed ?? 0) * 0.3) * 0.04;
  let coatFlutter = Math.sin(motion.frame * 0.16 + (motion.seed ?? 0) * 0.2) * 0.9;

  if (definition.role === 'protagonist') {
    hunch += 0.03;
    forwardLean += 0.08;
    armGuard += 1.8;
    if (motion.storyBeat === 'memory') {
      hunch -= 0.05;
      forwardLean -= 0.08;
      armGuard -= 1.2;
      breath += 0.16;
      headTilt += 0.02;
      coatFlutter *= 0.55;
    }
    if (motion.castType === 'forced') {
      forwardLean += 0.08;
      coatFlutter += 0.8;
    }
  }

  if (definition.role === 'companion') {
    if (motion.aikoState === 'scared') {
      hunch += 0.12;
      armGuard += 4;
      armCross += 4;
      forwardLean -= 0.12;
      headTilt -= 0.03;
    } else if (motion.aikoState === 'dependent') {
      hunch += 0.07;
      forwardLean += 0.1;
      armGuard += 2;
      strideBoost += 2;
      breath += 0.2;
    } else if (motion.aikoState === 'unstable') {
      hunch += 0.09;
      jitter += 1.1;
      armCross += 2;
      headTilt += Math.sin(motion.frame * 0.32) * 0.08;
    } else if (motion.aikoState === 'conscious') {
      hunch -= 0.08;
      forwardLean += 0.04;
      breath -= 0.12;
    }

    if (motion.poseVariant === 'seated') {
      hunch += 0.16;
      armGuard += 3;
      armCross += 3;
      strideBoost -= 2;
    }
  }

  if (definition.role === 'memory-anchor') {
    hunch -= 0.06;
    forwardLean -= 0.04;
    armGuard -= 0.8;
    breath += 0.18;
    coatFlutter *= 0.42;
    headTilt += 0.02;

    if (motion.expression === 'soft-smile') {
      breath += 0.1;
      headTilt += 0.03;
    } else if (motion.expression === 'serious') {
      hunch += 0.03;
      forwardLean += 0.06;
      headTilt -= 0.02;
    }

    if (motion.poseVariant === 'seated') {
      hunch += 0.04;
      armGuard += 1.1;
      armCross += 0.6;
      strideBoost -= 1.6;
    }
  }

  if (definition.role === 'enemy') {
    if (definition.characterName === 'Caido Comum') {
      hunch += 0.14;
      strideBoost += 2.6;
      armGuard -= 1.5;
      sideLean += Math.sin(motion.frame * 0.07 + (motion.seed ?? 0)) * 1.1;
      coatFlutter += 0.7;
    } else {
      hunch += 0.08;
      forwardLean += 0.06;
      strideBoost += 1.4;
      jitter += motion.enemyState === 'stunned' ? 0.8 : 0.1;
      breath -= 0.2;
    }
  }

  if (motion.enemyState === 'stunned') {
    jitter += 1.4;
    forwardLean -= 0.22;
    headTilt += 0.1;
  }

  if (motion.isDodging) {
    coatFlutter += 1.4;
  }

  return { hunch, forwardLean, sideLean, armGuard, armCross, strideBoost, jitter, breath, headTilt, coatFlutter };
}
