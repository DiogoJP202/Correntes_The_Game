import type {
  Aiko,
  CameraState,
  DialogueLine,
  GameState,
  Lia,
  MemoryInteractableId,
  MemorySceneState,
  NarrativeState,
  Player,
} from './types';

export const CANVAS_W = 900;
export const CANVAS_H = 500;

export const WALL_TOP = 80;
export const WALL_BOTTOM = 420;

export const MEMORY_LEFT = 72;
export const MEMORY_RIGHT = 842;
export const MEMORY_TOP = 126;
export const MEMORY_BOTTOM = 408;

export const MEMORY_OBSTACLES = [
  { x: 118, y: 144, w: 92, h: 86 },
  { x: 196, y: 336, w: 84, h: 44 },
  { x: 314, y: 154, w: 58, h: 94 },
  { x: 612, y: 136, w: 76, h: 92 },
  { x: 730, y: 314, w: 66, h: 48 },
];

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

export const MEMORY_ROOFTOP_PROPS = [
  { kind: 'water-tank', x: 108, y: 140, w: 102, h: 88, tint: '#6d6f75' },
  { kind: 'stairwell', x: 304, y: 148, w: 72, h: 104, tint: '#8b8078' },
  { kind: 'chair', x: 216, y: 344, w: 30, h: 34, tint: '#795e50' },
  { kind: 'backpack', x: 518, y: 328, w: 28, h: 20, tint: '#684d3f' },
  { kind: 'bottle', x: 570, y: 338, w: 10, h: 24, tint: '#78a2bc' },
  { kind: 'antenna', x: 648, y: 138, w: 14, h: 108, tint: '#81776f' },
  { kind: 'crate', x: 734, y: 316, w: 62, h: 46, tint: '#78685d' },
];

export const MEMORY_CLOTH_LINES = [
  { x1: 118, y1: 104, x2: 322, y2: 118, sag: 22 },
  { x1: 374, y1: 98, x2: 666, y2: 112, sag: 28 },
  { x1: 622, y1: 110, x2: 850, y2: 136, sag: 18 },
];

export const MEMORY_CITY_LAYERS = [
  {
    color: '#dfb07f',
    alpha: 0.18,
    buildings: [
      { x: 0, w: 76, h: 48 },
      { x: 66, w: 84, h: 66 },
      { x: 156, w: 68, h: 54 },
      { x: 232, w: 96, h: 76 },
      { x: 336, w: 74, h: 62 },
      { x: 424, w: 86, h: 82 },
      { x: 516, w: 96, h: 58 },
      { x: 620, w: 88, h: 70 },
      { x: 720, w: 78, h: 64 },
      { x: 804, w: 96, h: 50 },
    ],
  },
  {
    color: '#6d5361',
    alpha: 0.34,
    buildings: [
      { x: 14, w: 98, h: 72 },
      { x: 136, w: 82, h: 92 },
      { x: 232, w: 70, h: 80 },
      { x: 332, w: 112, h: 116 },
      { x: 456, w: 84, h: 88 },
      { x: 558, w: 98, h: 108 },
      { x: 672, w: 88, h: 82 },
      { x: 774, w: 118, h: 96 },
    ],
  },
  {
    color: '#3f3241',
    alpha: 0.7,
    buildings: [
      { x: 10, w: 90, h: 88 },
      { x: 114, w: 108, h: 120 },
      { x: 248, w: 84, h: 104 },
      { x: 350, w: 104, h: 136 },
      { x: 474, w: 92, h: 120 },
      { x: 584, w: 116, h: 144 },
      { x: 726, w: 68, h: 110 },
      { x: 800, w: 94, h: 126 },
    ],
  },
];

export const LIA_SCENE_POSITION = { x: 684, y: 306 };
export const LIA_SIT_TARGET = { x: 634, y: 314 };

export const MEMORY_INTERACTABLES: Array<{
  id: MemoryInteractableId;
  x: number;
  y: number;
  radius: number;
  prompt: string;
  thought: string;
}> = [
  {
    id: 'city',
    x: 796,
    y: 246,
    radius: 58,
    prompt: 'Olhar a cidade',
    thought: 'Daqui de cima, a cidade parecia menos barulhenta.',
  },
  {
    id: 'chair',
    x: 232,
    y: 360,
    radius: 40,
    prompt: 'Observar a cadeira',
    thought: 'Nem todo silencio era vazio.',
  },
  {
    id: 'backpack',
    x: 528,
    y: 344,
    radius: 38,
    prompt: 'Observar a mochila',
    thought: 'As vezes, ficar era o suficiente.',
  },
  {
    id: 'bottle',
    x: 572,
    y: 348,
    radius: 34,
    prompt: 'Tocar a garrafa',
    thought: 'O calor ja estava indo embora, mas ainda tinha luz no vidro.',
  },
  {
    id: 'wires',
    x: 650,
    y: 156,
    radius: 42,
    prompt: 'Observar os fios',
    thought: 'O vento sempre encontrava alguma coisa para levar.',
  },
  {
    id: 'sky',
    x: 430,
    y: 188,
    radius: 44,
    prompt: 'Olhar o ceu',
    thought: 'Tinha dias em que o mundo parecia caber numa pausa.',
  },
  {
    id: 'railing',
    x: 746,
    y: 320,
    radius: 44,
    prompt: 'Encostar na grade',
    thought: 'O vento fazia o mundo parecer menos pesado.',
  },
];

export const MEMORY_SCENE_FINAL_CAPTION = 'Alguns vinculos nao comecam com promessas. Comecam com presenca.';

export const MEMORY_DIALOGUE_OPENING: DialogueLine[] = [
  {
    speaker: 'Lia',
    text: 'Voce fica quieto demais nesses momentos.',
    autoAdvanceMs: 1150,
    cameraShot: 'lia',
  },
  {
    speaker: 'Ren',
    text: 'Nao sabia que silencio precisava de resposta.',
    autoAdvanceMs: 1100,
    cameraShot: 'ren',
  },
  {
    speaker: 'Lia',
    text: 'Nao precisa.',
    autoAdvanceMs: 1420,
    cameraShot: 'sky',
  },
  {
    speaker: 'Lia',
    text: 'Mas com voce... parece que ele diz alguma coisa.',
    autoAdvanceMs: 1300,
    cameraShot: 'lia',
  },
  {
    speaker: 'Ren',
    text: 'Isso e bom ou ruim?',
    autoAdvanceMs: 980,
    cameraShot: 'ren',
  },
  {
    speaker: 'Lia',
    text: 'Hoje? Bom.',
    autoAdvanceMs: 1500,
    cameraShot: 'lia',
  },
  {
    speaker: 'Ren',
    text: 'Voce acha que isso dura?',
    autoAdvanceMs: 1080,
    cameraShot: 'ren',
  },
  {
    speaker: 'Lia',
    text: 'Se for de verdade... ja esta durando.',
    autoAdvanceMs: 1850,
    cameraShot: 'wide',
  },
  {
    speaker: 'Lia',
    text: 'Voce sempre tenta carregar tudo sozinho.',
    cameraShot: 'duo',
    choices: [
      {
        text: 'Eu so nao quero pesar para ninguem.',
        effect: 'memory-vulnerability',
        tone: 'trust',
      },
      {
        text: 'Alguem precisa aguentar.',
        effect: 'memory-burden',
        dark: true,
        tone: 'dependency',
      },
      {
        text: 'Voce fala como se me conhecesse.',
        effect: 'memory-lightness',
        tone: 'intimacy',
      },
    ],
  },
];

export const MEMORY_DIALOGUE_VULNERABILITY: DialogueLine[] = [
  {
    speaker: 'Ren',
    text: 'Eu so nao quero pesar para ninguem.',
    autoAdvanceMs: 1100,
    cameraShot: 'ren',
  },
  {
    speaker: 'Lia',
    text: 'Entao divide um pouco.',
    autoAdvanceMs: 1020,
    cameraShot: 'lia',
  },
  {
    speaker: 'Lia',
    text: 'Nem que seja so o silencio.',
    autoAdvanceMs: 1750,
    cameraShot: 'wide',
  },
];

export const MEMORY_DIALOGUE_BURDEN: DialogueLine[] = [
  {
    speaker: 'Ren',
    text: 'Alguem precisa aguentar.',
    autoAdvanceMs: 980,
    cameraShot: 'ren',
  },
  {
    speaker: 'Lia',
    text: 'So cuidado para nao confundir forca com prisao.',
    autoAdvanceMs: 1850,
    cameraShot: 'wide',
  },
];

export const MEMORY_DIALOGUE_LIGHTNESS: DialogueLine[] = [
  {
    speaker: 'Ren',
    text: 'Voce fala como se me conhecesse.',
    autoAdvanceMs: 1100,
    cameraShot: 'ren',
  },
  {
    speaker: 'Lia',
    text: 'Eu conheco o suficiente para ficar.',
    autoAdvanceMs: 1780,
    cameraShot: 'wide',
  },
];

export const DIALOGUE_AIKO_MEET: DialogueLine[] = [
  { speaker: 'Aiko', text: 'Voce vai ficar ai so olhando?' },
  { speaker: 'Ren', text: 'Nao. Mas eu preciso saber se voce ainda quer se mover.' },
  { speaker: 'Aiko', text: 'Querer... eu nao sei mais. So nao quero sumir aqui.' },
  {
    speaker: '',
    text: 'O que Ren oferece a ela?',
    choices: [
      { text: 'Entao caminha comigo.', effect: 'trust', tone: 'trust' },
      { text: 'Voce precisa de mim.', effect: 'dependency', dark: true, tone: 'dependency' },
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

export function createMemoryPlayer(): Player {
  return {
    pos: { x: 180, y: 314 },
    vel: { x: 0, y: 0 },
    radius: 16,
    health: 100,
    maxHealth: 100,
    eloEnergy: 100,
    maxEloEnergy: 100,
    stability: 100,
    maxStability: 100,
    speed: 2.65,
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

export function createPresentPlayer(): Player {
  const player = createMemoryPlayer();
  player.pos = { x: 92, y: 250 };
  player.speed = 3.35;
  player.facing = { x: 1, y: 0 };
  return player;
}

export function createInitialPlayer(): Player {
  return createMemoryPlayer();
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

export function createInitialLia(): Lia {
  return {
    pos: { ...LIA_SCENE_POSITION },
    targetPos: { ...LIA_SCENE_POSITION },
    radius: 15,
    bobTimer: 0,
    pulseTimer: 0,
    seated: true,
    expression: 'neutral',
  };
}

export function createInitialNarrativeState(): NarrativeState {
  return {
    rooftopInteractions: [],
    firstThreadWitnessed: false,
    scene1Choice: null,
    scene1BondVariant: null,
    scene1Complete: false,
  };
}

export function createInitialMemoryState(): MemorySceneState {
  return {
    nearbyTarget: null,
    thoughtText: '',
    thoughtTimer: 0,
    inspectLockTimer: 0,
    fadeAlpha: 1,
    outroTimer: 0,
    finalCaptionAlpha: 0,
    finalCaptionVisible: false,
  };
}

export function createInitialGameState(): GameState {
  return {
    phase: 'MEMORY_FADE_IN',
    phaseTimer: 0,
    player: createInitialPlayer(),
    aiko: createInitialAiko(),
    lia: createInitialLia(),
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
    memory: createInitialMemoryState(),
    narrative: createInitialNarrativeState(),
  };
}
