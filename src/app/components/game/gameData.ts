import type { CameraState, DialogueLine, Player, Aiko, GameState } from './types';

export const CANVAS_W = 900;
export const CANVAS_H = 500;
export const WALL_TOP = 80;
export const WALL_BOTTOM = 420;

export const OBSTACLES = [
  { x: 188, y: 100, w: 62, h: 54 },
  { x: 170, y: 344, w: 60, h: 56 },
  { x: 420, y: 92, w: 58, h: 58 },
  { x: 440, y: 358, w: 64, h: 54 },
  { x: 648, y: 110, w: 58, h: 56 },
];

export const STREET_PROPS = [
  { kind: 'dumpster', x: 44, y: 298, w: 64, h: 56, tint: '#0f1c27' },
  { kind: 'crate-stack', x: 304, y: 112, w: 52, h: 44, tint: '#1c2131' },
  { kind: 'barrel-pile', x: 566, y: 335, w: 48, h: 58, tint: '#24171d' },
  { kind: 'cables', x: 780, y: 120, w: 72, h: 18, tint: '#101622' },
  { kind: 'trash', x: 126, y: 386, w: 26, h: 12, tint: '#324250' },
  { kind: 'trash', x: 710, y: 388, w: 30, h: 12, tint: '#35424f' },
];

export const OVERHEAD_WIRES = [
  { x1: 0, y1: 36, x2: 200, y2: 58, sag: 16 },
  { x1: 140, y1: 30, x2: 440, y2: 52, sag: 22 },
  { x1: 390, y1: 28, x2: 770, y2: 48, sag: 26 },
  { x1: 640, y1: 34, x2: 900, y2: 50, sag: 18 },
];

export const STEAM_VENTS = [
  { x: 122, y: 390, size: 18 },
  { x: 520, y: 370, size: 14 },
  { x: 810, y: 352, size: 12 },
];

export const PUDDLES = [
  { x: 148, y: 352, rx: 62, ry: 20 },
  { x: 380, y: 282, rx: 84, ry: 24 },
  { x: 594, y: 378, rx: 54, ry: 18 },
  { x: 760, y: 214, rx: 48, ry: 15 },
];

export const NEON_LIGHTS = [
  { x: 86, y: WALL_TOP, color: '#0d66ff', w: 70, side: 'top' as const, label: 'MOTEL' },
  { x: 278, y: WALL_TOP, color: '#4f2ac8', w: 50, side: 'top' as const, label: 'CAFE' },
  { x: 498, y: WALL_BOTTOM, color: '#1f63ff', w: 66, side: 'bottom' as const, label: 'VOID' },
  { x: 716, y: WALL_TOP, color: '#6626b8', w: 54, side: 'top' as const, label: 'BAR' },
  { x: 852, y: WALL_BOTTOM, color: '#8d264a', w: 42, side: 'bottom' as const, label: 'OPEN' },
];

export const DIALOGUE_AIKO_MEET: DialogueLine[] = [
  { speaker: 'Aiko', text: 'Voce vai ficar ai so olhando?' },
  { speaker: 'Ren', text: 'Nao. Mas eu preciso saber se voce ainda quer se mover.' },
  { speaker: 'Aiko', text: 'Querer... eu nao sei mais. So nao quero sumir aqui.' },
  {
    speaker: '',
    text: 'O que Ren oferece a ela?',
    choices: [
      { text: 'Entao caminha comigo.', effect: 'trust' },
      { text: 'Voce precisa de mim.', effect: 'dependency', dark: true },
    ],
  },
];

export const DIALOGUE_TRUST_RESULT: DialogueLine[] = [
  { speaker: 'Ren', text: 'Entao caminha comigo.' },
  { speaker: 'Aiko', text: '...Tudo bem. Eu tento, mas no meu passo.' },
  { speaker: '', text: '[Fio de Vinculo desbloqueado - Q]' },
];

export const DIALOGUE_DEPENDENCY_RESULT: DialogueLine[] = [
  { speaker: 'Ren', text: 'Voce precisa de mim.' },
  { speaker: 'Aiko', text: '...Eu sei. E isso me assusta mais do que devia.' },
  { speaker: '', text: '[Corrente Forcada desbloqueada - E | Fio de Vinculo desbloqueado - Q]' },
];

export const DIALOGUE_PRE_COMBAT: DialogueLine[] = [
  { speaker: 'Aiko', text: 'Tem alguma coisa vindo do fundo do beco...' },
  { speaker: 'Ren', text: 'Fica perto de mim. Mas continua respirando por conta propria.' },
];

export const DIALOGUE_POST_COMBAT_DEPENDENCY: DialogueLine[] = [
  {
    speaker: 'Aiko',
    text: 'Quando voce puxa essa corrente... eu sinto como se uma parte minha parasse de me obedecer.',
  },
  { speaker: 'Ren', text: '...' },
  { speaker: 'Aiko', text: 'Nao me deixa para tras. Nem de voce.' },
];

export const DIALOGUE_POST_COMBAT_TRUST: DialogueLine[] = [
  { speaker: 'Aiko', text: 'Eu ainda estou com medo... mas agora consigo andar sem ser arrastada.' },
  { speaker: 'Ren', text: 'Entao continua. Um passo seu ainda vale mais do que um elo meu.' },
];

function createInitialCamera(): CameraState {
  return {
    x: CANVAS_W * 0.5,
    y: CANVAS_H * 0.5,
    zoom: 1,
    targetX: CANVAS_W * 0.5,
    targetY: CANVAS_H * 0.5,
    targetZoom: 1,
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    bars: 0,
    focusMix: 0,
  };
}

export function createInitialPlayer(): Player {
  return {
    pos: { x: 92, y: 250 },
    vel: { x: 0, y: 0 },
    radius: 16,
    health: 100,
    maxHealth: 100,
    eloEnergy: 100,
    maxEloEnergy: 100,
    stability: 100,
    maxStability: 100,
    speed: 3.35,
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
    castTimer: 0,
    castType: null,
    moveTilt: 0,
  };
}

export function createInitialAiko(): Aiko {
  return {
    pos: { x: 754, y: 276 },
    targetPos: { x: 754, y: 276 },
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
    camera: createInitialCamera(),
    dialogueActive: false,
    dialogueQueue: [],
    dialogueIndex: 0,
    awaitingChoice: false,
    chosenPath: null,
    choiceFlash: 0,
    choiceTone: null,
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
