export type GamePhase =
  | 'MEMORY_FADE_IN'
  | 'MEMORY_EXPLORE'
  | 'MEMORY_APPROACH'
  | 'MEMORY_DIALOGUE'
  | 'MEMORY_OUTRO'
  | 'INTRO'
  | 'EXPLORE'
  | 'DIALOGUE'
  | 'PRE_COMBAT'
  | 'COMBAT'
  | 'POST_COMBAT'
  | 'ENDING';

export type AikoStateType = 'scared' | 'dependent' | 'unstable' | 'conscious';
export type EnemyType = 'common' | 'heavy';
export type EnemyAIState = 'patrol' | 'chase' | 'attack' | 'stunned' | 'dead';
export type ParticleType = 'rain' | 'hit' | 'aura' | 'spark' | 'dust' | 'ring' | 'mist' | 'stability';
export type ChoiceTone = 'trust' | 'dependency' | 'intimacy' | null;
export type DialogueCameraShot = 'wide' | 'duo' | 'lia' | 'ren' | 'sky';
export type MemoryChoiceKey = 'vulnerability' | 'burden' | 'lightness' | null;
export type MemoryInteractableId = 'city' | 'chair' | 'backpack' | 'bottle' | 'wires' | 'sky' | 'railing';
export type DialogueChoiceEffect =
  | 'trust'
  | 'dependency'
  | 'memory-vulnerability'
  | 'memory-burden'
  | 'memory-lightness';
export type BondVisualStyle =
  | 'combat-bond'
  | 'memory-bond'
  | 'memory-bond-stable'
  | 'memory-bond-strained'
  | 'memory-bond-warm'
  | 'memory-bond-final';

export interface Vec2 {
  x: number;
  y: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  shake: number;
  shakeX: number;
  shakeY: number;
  bars: number;
  focusMix: number;
}

export interface Player {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  eloEnergy: number;
  maxEloEnergy: number;
  stability: number;
  maxStability: number;
  speed: number;
  facing: Vec2;
  isAttacking: boolean;
  attackTimer: number;
  attackType: 'light' | 'heavy' | null;
  attackCooldown: number;
  isDodging: boolean;
  dodgeTimer: number;
  dodgeCooldown: number;
  dodgeVel: Vec2;
  invincible: boolean;
  invincibleTimer: number;
  qCooldown: number;
  eCooldown: number;
  forcedChainCount: number;
  hitFlash: number;
  eloRegenTimer: number;
  castTimer: number;
  castType: 'bond' | 'forced' | null;
  moveTilt: number;
}

export interface Aiko {
  pos: Vec2;
  targetPos: Vec2;
  radius: number;
  trust: number;
  dependency: number;
  autonomy: number;
  state: AikoStateType;
  phrase: string | null;
  phraseTimer: number;
  bobTimer: number;
  pulseTimer: number;
}

export interface Lia {
  pos: Vec2;
  targetPos: Vec2;
  radius: number;
  bobTimer: number;
  pulseTimer: number;
  seated: boolean;
  expression: 'neutral' | 'soft-smile' | 'serious';
}

export interface Enemy {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  type: EnemyType;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  attackTelegraph: number;
  stunTimer: number;
  slowTimer: number;
  aiState: EnemyAIState;
  hitFlash: number;
  deathTimer: number;
  patrolTarget: Vec2;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  color: string;
  size: number;
  rotation?: number;
  elongation?: number;
  glow?: number;
}

export interface ChainEffect {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'bond' | 'forced';
  style?: BondVisualStyle;
  timer: number;
  maxTimer: number;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  autoAdvanceMs?: number;
  cameraShot?: DialogueCameraShot;
}

export interface DialogueChoice {
  text: string;
  effect: DialogueChoiceEffect;
  dark?: boolean;
  tone?: Exclude<ChoiceTone, null>;
}

export interface NarrativeState {
  rooftopInteractions: MemoryInteractableId[];
  firstThreadWitnessed: boolean;
  scene1Choice: MemoryChoiceKey;
  scene1BondVariant: 'stable' | 'strained' | 'warm' | null;
  scene1Complete: boolean;
}

export interface MemorySceneState {
  nearbyTarget: MemoryInteractableId | 'lia' | null;
  thoughtText: string;
  thoughtTimer: number;
  inspectLockTimer: number;
  fadeAlpha: number;
  outroTimer: number;
  finalCaptionAlpha: number;
  finalCaptionVisible: boolean;
}

export interface GameState {
  phase: GamePhase;
  phaseTimer: number;
  player: Player;
  aiko: Aiko;
  lia: Lia;
  enemies: Enemy[];
  particles: Particle[];
  chainEffects: ChainEffect[];
  camera: CameraState;
  dialogueActive: boolean;
  dialogueQueue: DialogueLine[];
  dialogueIndex: number;
  awaitingChoice: boolean;
  chosenPath: 'trust' | 'dependency' | null;
  choiceFlash: number;
  choiceTone: ChoiceTone;
  combatWave: number;
  waveTransitionTimer: number;
  nearAiko: boolean;
  frameCount: number;
  enemyIdCounter: number;
  chainIdCounter: number;
  introTimer: number;
  hintText: string;
  hintTimer: number;
  combatStarted: boolean;
  postCombatShown: boolean;
  memory: MemorySceneState;
  narrative: NarrativeState;
}

export interface GameResult {
  dependency: number;
  trust: number;
  autonomy: number;
  forcedChainCount: number;
  chosenPath: 'trust' | 'dependency' | null;
  narrative?: NarrativeState;
}

export interface UIState {
  phase: GamePhase;
  playerHp: number;
  playerMaxHp: number;
  playerEnergy: number;
  playerMaxEnergy: number;
  playerStability: number;
  playerMaxStability: number;
  aikoState: AikoStateType;
  aikoDependency: number;
  aikoTrust: number;
  aikoAutonomy: number;
  forcedChainCount: number;
  nearAiko: boolean;
  hintText: string;
  dialogueActive: boolean;
  dialogueLine: DialogueLine | null;
  awaitingChoice: boolean;
  aikoPhrase: string | null;
  introVisible: boolean;
  combatWave: number;
  lowStability: boolean;
  choiceTone: ChoiceTone;
  memoryThought: string;
  isMemoryScene: boolean;
  fadeAlpha: number;
  finalCaptionAlpha: number;
  finalCaptionVisible: boolean;
}
