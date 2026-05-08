import type { DialogueLine, Player, Aiko, GameState } from './types';

export const CANVAS_W = 900;
export const CANVAS_H = 500;
export const WALL_TOP = 80;
export const WALL_BOTTOM = 420;

export const OBSTACLES = [
  { x: 195, y: 95, w: 55, h: 55 },
  { x: 175, y: 345, w: 55, h: 55 },
  { x: 420, y: 95, w: 55, h: 55 },
  { x: 440, y: 360, w: 55, h: 55 },
  { x: 650, y: 110, w: 55, h: 55 },
];

export const NEON_LIGHTS = [
  { x: 80, y: WALL_TOP, color: '#0066ff', w: 60, side: 'top' as const },
  { x: 280, y: WALL_TOP, color: '#4400aa', w: 40, side: 'top' as const },
  { x: 500, y: WALL_BOTTOM, color: '#0044cc', w: 50, side: 'bottom' as const },
  { x: 720, y: WALL_TOP, color: '#220066', w: 45, side: 'top' as const },
  { x: 860, y: WALL_BOTTOM, color: '#660022', w: 35, side: 'bottom' as const },
];

// ── Dialogue data ──────────────────────────────────────────────────────────────
export const DIALOGUE_AIKO_MEET: DialogueLine[] = [
  { speaker: 'Aiko', text: 'Você vai ficar aí só olhando?' },
  { speaker: 'Ren', text: 'Você quer ajuda?' },
  { speaker: 'Aiko', text: 'Querer... eu não sei mais.' },
  {
    speaker: '',
    text: 'O que você diz a ela?',
    choices: [
      { text: 'Então caminha comigo.', effect: 'trust' },
      { text: 'Você precisa de mim.', effect: 'dependency', dark: true },
    ],
  },
];

export const DIALOGUE_TRUST_RESULT: DialogueLine[] = [
  { speaker: 'Ren', text: 'Então caminha comigo.' },
  { speaker: 'Aiko', text: '...Tudo bem. Vou tentar.' },
  { speaker: '', text: '[Fio de Vínculo desbloqueado — Q]' },
];

export const DIALOGUE_DEPENDENCY_RESULT: DialogueLine[] = [
  { speaker: 'Ren', text: 'Você precisa de mim.' },
  { speaker: 'Aiko', text: '...Eu... sim. Não consigo negar.' },
  { speaker: '', text: '[Corrente Forçada desbloqueada — E | Fio de Vínculo desbloqueado — Q]' },
];

export const DIALOGUE_PRE_COMBAT: DialogueLine[] = [
  { speaker: 'Aiko', text: 'Tem alguma coisa vindo...' },
  { speaker: 'Ren', text: 'Fica atrás de mim.' },
];

export const DIALOGUE_POST_COMBAT_DEPENDENCY: DialogueLine[] = [
  {
    speaker: 'Aiko',
    text: 'Quando você puxa essa corrente... eu sinto como se uma parte minha ficasse com você.',
  },
  { speaker: 'Ren', text: '...' },
  { speaker: 'Aiko', text: 'Não me deixa para trás.' },
];

export const DIALOGUE_POST_COMBAT_TRUST: DialogueLine[] = [
  { speaker: 'Aiko', text: 'Eu ainda estou com medo... mas consigo andar.' },
  { speaker: 'Ren', text: 'Está bem. Continue andando.' },
];

// ── Initial state factory ──────────────────────────────────────────────────────
export function createInitialPlayer(): Player {
  return {
    pos: { x: 90, y: 250 },
    vel: { x: 0, y: 0 },
    radius: 16,
    health: 100,
    maxHealth: 100,
    eloEnergy: 100,
    maxEloEnergy: 100,
    stability: 100,
    maxStability: 100,
    speed: 3.2,
    facing: { x: 1, y: 0 },
    isAttacking: false,
    attackTimer: 0,
    attackType: null,
    attackCooldown: 0,
    isDodging: false,
    dodgeTimer: 0,
    dodgeCooldown: 0,
    dodgeVel: { x: 0, y: 0 },
    invincible: false,
    invincibleTimer: 0,
    qCooldown: 0,
    eCooldown: 0,
    forcedChainCount: 0,
    hitFlash: 0,
    eloRegenTimer: 0,
  };
}

export function createInitialAiko(): Aiko {
  return {
    pos: { x: 760, y: 270 },
    targetPos: { x: 760, y: 270 },
    radius: 14,
    trust: 20,
    dependency: 0,
    autonomy: 50,
    state: 'scared',
    phrase: null,
    phraseTimer: 0,
    bobTimer: 0,
    pulseTimer: 0,
  };
}

export function createInitialGameState(): GameState {
  return {
    phase: 'INTRO',
    player: createInitialPlayer(),
    aiko: createInitialAiko(),
    enemies: [],
    particles: [],
    chainEffects: [],
    dialogueActive: false,
    dialogueQueue: [],
    dialogueIndex: 0,
    awaitingChoice: false,
    chosenPath: null,
    combatWave: 0,
    waveTransitionTimer: 0,
    nearAiko: false,
    frameCount: 0,
    enemyIdCounter: 0,
    chainIdCounter: 0,
    introTimer: 0,
    hintText: '',
    hintTimer: 0,
    combatStarted: false,
    postCombatShown: false,
  };
}
