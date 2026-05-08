import type { EnemyType } from './types';

export type CharacterRole =
  | 'protagonist'
  | 'companion'
  | 'enemy'
  | 'future-ally';

export type BondType =
  | 'fractured-thread'
  | 'fear-bound'
  | 'void-corruption'
  | 'impact-fragment'
  | 'insight-thread'
  | 'silence-fragment';

export interface CharacterPalette {
  skin: string;
  hair: string;
  outfitPrimary: string;
  outfitSecondary: string;
  accent: string;
  glow: string;
  eyes: string;
  shadow: string;
  metal?: string;
}

export interface CharacterSilhouette {
  scale: number;
  shoulderWidth: number;
  hipWidth: number;
  armLength: number;
  legLength: number;
  headRadius: number;
  stanceWidth: number;
  torsoHeight: number;
  hunch: number;
  coatLength: number;
  hairVolume: number;
}

export interface CharacterCostume {
  coatShape: 'split-coat' | 'worn-dress' | 'rag-wraps' | 'brute-shell' | 'street-jacket' | 'utility-coat' | 'silent-cloak';
  sleeveShape: 'long' | 'rolled' | 'torn' | 'heavy';
  hairShape: 'messy-mid' | 'soft-bob' | 'ragged-fall' | 'spike-mass' | 'short-bands' | 'sleek-parted' | 'shadow-fringe';
  boots: boolean;
  chainTrim: boolean;
  bandages: boolean;
  skirtPanels: boolean;
  tornHem: boolean;
}

export interface CharacterDefinition {
  characterName: string;
  role: CharacterRole;
  description: string;
  themeColor: string;
  movementStyle: string;
  personalityTags: string[];
  bondType: BondType;
  futureAbilityName: string;
  futureAbilityDescription: string;
  outfitStyle: string;
  hairStyle: string;
  visualNotes: string;
  palette: CharacterPalette;
  silhouette: CharacterSilhouette;
  costume: CharacterCostume;
}

export type CharacterKey =
  | 'ren'
  | 'aiko'
  | 'fallen-common'
  | 'fallen-heavy'
  | 'ryu'
  | 'mika'
  | 'taro';

export const CHARACTER_DEFINITIONS: Record<CharacterKey, CharacterDefinition> = {
  ren: {
    characterName: 'Ren',
    role: 'protagonist',
    description: 'Jovem adulto urbano, marcado pela perda e por vinculos que teme repetir.',
    themeColor: '#7fb7ff',
    movementStyle: 'controlado, tenso, preciso',
    personalityTags: ['melancolico', 'contido', 'protetor', 'ferido'],
    bondType: 'fractured-thread',
    futureAbilityName: 'Coroa do Elo',
    futureAbilityDescription: 'Canaliza vinculos estaveis em defesa e leitura emocional.',
    outfitStyle: 'sobretudo curto, roupa urbana escura, detalhes discretos de corrente',
    hairStyle: 'cabelo escuro baguncado, caindo sobre a testa',
    visualNotes: 'Silhueta magra, casaco dividido, brilho no peito e nas maos.',
    palette: {
      skin: '#d8c5b4',
      hair: '#1a2034',
      outfitPrimary: '#1f2537',
      outfitSecondary: '#394661',
      accent: '#88b8ff',
      glow: '#7ec6ff',
      eyes: '#dfeaff',
      shadow: '#0b1020',
      metal: '#8ea8c9',
    },
    silhouette: {
      scale: 1,
      shoulderWidth: 14,
      hipWidth: 10,
      armLength: 17,
      legLength: 18,
      headRadius: 6.5,
      stanceWidth: 8,
      torsoHeight: 18,
      hunch: 0.08,
      coatLength: 15,
      hairVolume: 6,
    },
    costume: {
      coatShape: 'split-coat',
      sleeveShape: 'long',
      hairShape: 'messy-mid',
      boots: true,
      chainTrim: true,
      bandages: false,
      skirtPanels: false,
      tornHem: false,
    },
  },
  aiko: {
    characterName: 'Aiko',
    role: 'companion',
    description: 'Companheira vulneravel, importante para o arco emocional e nunca tratada como recurso.',
    themeColor: '#f0b7c3',
    movementStyle: 'retraida, hesitante, depois mais proxima e dependente',
    personalityTags: ['sensivel', 'assustada', 'humana', 'vulneravel'],
    bondType: 'fear-bound',
    futureAbilityName: 'Respirar Sozinha',
    futureAbilityDescription: 'Recupera autonomia e resiste a vinculos forcados.',
    outfitStyle: 'roupa clara gasta, silhueta leve, mangas longas',
    hairStyle: 'cabelo castanho curto com mechas suaves',
    visualNotes: 'Postura encolhida no inicio, silhueta delicada, brilho instavel em dependencia alta.',
    palette: {
      skin: '#ead4c7',
      hair: '#5a463d',
      outfitPrimary: '#d1c6c0',
      outfitSecondary: '#a89a94',
      accent: '#f2c3d7',
      glow: '#ffb8d0',
      eyes: '#fff4f8',
      shadow: '#392e35',
      metal: '#bda9af',
    },
    silhouette: {
      scale: 0.92,
      shoulderWidth: 11,
      hipWidth: 9,
      armLength: 15,
      legLength: 16,
      headRadius: 6,
      stanceWidth: 6,
      torsoHeight: 16,
      hunch: 0.18,
      coatLength: 13,
      hairVolume: 5.5,
    },
    costume: {
      coatShape: 'worn-dress',
      sleeveShape: 'long',
      hairShape: 'soft-bob',
      boots: true,
      chainTrim: false,
      bandages: false,
      skirtPanels: true,
      tornHem: false,
    },
  },
  'fallen-common': {
    characterName: 'Caido Comum',
    role: 'enemy',
    description: 'Humano corrompido pelo vazio, curvado e agressivo.',
    themeColor: '#c93f2e',
    movementStyle: 'arrastado, torto, com investida brusca',
    personalityTags: ['corrompido', 'vazio', 'hostil'],
    bondType: 'void-corruption',
    futureAbilityName: 'Fome de Eco',
    futureAbilityDescription: 'Amplifica o vazio e drena estabilidade de quem se aproxima.',
    outfitStyle: 'roupa rasgada, tronco curvado, silhueta quebrada',
    hairStyle: 'mechas duras e irregulares',
    visualNotes: 'Bracos mais longos, olhos opacos, hem rasgado e marcha instavel.',
    palette: {
      skin: '#62514c',
      hair: '#2a1d1a',
      outfitPrimary: '#4d1713',
      outfitSecondary: '#2c0f0d',
      accent: '#d44c37',
      glow: '#ff6a44',
      eyes: '#1b0f0f',
      shadow: '#15080a',
      metal: '#6f5c57',
    },
    silhouette: {
      scale: 0.98,
      shoulderWidth: 13,
      hipWidth: 9,
      armLength: 19,
      legLength: 17,
      headRadius: 5.8,
      stanceWidth: 7,
      torsoHeight: 17,
      hunch: 0.34,
      coatLength: 12,
      hairVolume: 4,
    },
    costume: {
      coatShape: 'rag-wraps',
      sleeveShape: 'torn',
      hairShape: 'ragged-fall',
      boots: false,
      chainTrim: false,
      bandages: false,
      skirtPanels: false,
      tornHem: true,
    },
  },
  'fallen-heavy': {
    characterName: 'Caido Pesado',
    role: 'enemy',
    description: 'Massa humana endurecida pelo vazio, lenta e opressiva.',
    themeColor: '#8f2018',
    movementStyle: 'pesado, esmagador, lento',
    personalityTags: ['bruto', 'ameacador', 'corrompido'],
    bondType: 'void-corruption',
    futureAbilityName: 'Casco do Abismo',
    futureAbilityDescription: 'Aumenta massa, impacto e resistencia sob forte corrupcao.',
    outfitStyle: 'carcaca deformada, ombros largos, membros grossos',
    hairStyle: 'massa espessa e curta',
    visualNotes: 'Peito enorme, bracos grossos, passos de tanque e brilho interno avermelhado.',
    palette: {
      skin: '#56322f',
      hair: '#281412',
      outfitPrimary: '#38100d',
      outfitSecondary: '#5d1a14',
      accent: '#e45837',
      glow: '#ff8158',
      eyes: '#0f0808',
      shadow: '#120607',
      metal: '#79534d',
    },
    silhouette: {
      scale: 1.16,
      shoulderWidth: 18,
      hipWidth: 13,
      armLength: 18,
      legLength: 18,
      headRadius: 6.8,
      stanceWidth: 10,
      torsoHeight: 19,
      hunch: 0.22,
      coatLength: 11,
      hairVolume: 3.5,
    },
    costume: {
      coatShape: 'brute-shell',
      sleeveShape: 'heavy',
      hairShape: 'spike-mass',
      boots: false,
      chainTrim: false,
      bandages: false,
      skirtPanels: false,
      tornHem: true,
    },
  },
  ryu: {
    characterName: 'Ryu',
    role: 'future-ally',
    description: 'Ex-lutador de rua, impulsivo e poderoso.',
    themeColor: '#b2442f',
    movementStyle: 'frontal, explosivo, de impacto',
    personalityTags: ['impulsivo', 'forte', 'leal'],
    bondType: 'impact-fragment',
    futureAbilityName: 'Fragmento de Impacto',
    futureAbilityDescription: 'Concentra forca bruta e ruptura de guarda em ataques de curto alcance.',
    outfitStyle: 'jaqueta curta, faixa nos punhos, torso mais robusto',
    hairStyle: 'curto e bruto',
    visualNotes: 'Silhueta larga, antebracos fortes e acentos vermelhos de combate.',
    palette: {
      skin: '#b88a6f',
      hair: '#2f1d17',
      outfitPrimary: '#3b2220',
      outfitSecondary: '#742e24',
      accent: '#cb6550',
      glow: '#ff9d6e',
      eyes: '#f7ddce',
      shadow: '#1a0f0c',
      metal: '#8f6f63',
    },
    silhouette: {
      scale: 1.08,
      shoulderWidth: 17,
      hipWidth: 11,
      armLength: 17,
      legLength: 18,
      headRadius: 6.4,
      stanceWidth: 9,
      torsoHeight: 18,
      hunch: 0.06,
      coatLength: 9,
      hairVolume: 4,
    },
    costume: {
      coatShape: 'street-jacket',
      sleeveShape: 'rolled',
      hairShape: 'short-bands',
      boots: true,
      chainTrim: false,
      bandages: true,
      skirtPanels: false,
      tornHem: false,
    },
  },
  mika: {
    characterName: 'Mika',
    role: 'future-ally',
    description: 'Estrategista observadora, precisa e elegante.',
    themeColor: '#8aa6b3',
    movementStyle: 'calculado, economico, atento',
    personalityTags: ['calma', 'analitica', 'observadora'],
    bondType: 'insight-thread',
    futureAbilityName: 'Leitura de Campo',
    futureAbilityDescription: 'Antecipacao, marcacao de trajetorias e leitura de riscos no combate.',
    outfitStyle: 'casaco utilitario elegante, linhas limpas',
    hairStyle: 'corte alinhado com franja lateral',
    visualNotes: 'Silhueta limpa, detalhes frios e postura sempre centrada.',
    palette: {
      skin: '#d9c2b0',
      hair: '#28394a',
      outfitPrimary: '#1a2630',
      outfitSecondary: '#5e7580',
      accent: '#9ecfda',
      glow: '#9fddeb',
      eyes: '#edf9ff',
      shadow: '#0c151c',
      metal: '#9db4c0',
    },
    silhouette: {
      scale: 0.98,
      shoulderWidth: 13,
      hipWidth: 10,
      armLength: 16,
      legLength: 17,
      headRadius: 6.2,
      stanceWidth: 7,
      torsoHeight: 17,
      hunch: 0.03,
      coatLength: 12,
      hairVolume: 4.5,
    },
    costume: {
      coatShape: 'utility-coat',
      sleeveShape: 'long',
      hairShape: 'sleek-parted',
      boots: true,
      chainTrim: false,
      bandages: false,
      skirtPanels: false,
      tornHem: false,
    },
  },
  taro: {
    characterName: 'Taro',
    role: 'future-ally',
    description: 'Presenca furtiva, silenciosa e quase sem peso.',
    themeColor: '#5d6f80',
    movementStyle: 'leve, furtivo, economico',
    personalityTags: ['silencioso', 'furtivo', 'contido'],
    bondType: 'silence-fragment',
    futureAbilityName: 'Passo Mudo',
    futureAbilityDescription: 'Evasao, apagamento de presenca e controle de ruido emocional.',
    outfitStyle: 'manto escuro minimalista, silhueta estreita',
    hairStyle: 'franja escura discreta',
    visualNotes: 'Silhueta fina, capa curta fechada e brilho muito contido.',
    palette: {
      skin: '#c6b2a2',
      hair: '#141a20',
      outfitPrimary: '#151b24',
      outfitSecondary: '#283442',
      accent: '#7c98ad',
      glow: '#8ca9bc',
      eyes: '#d9ecf5',
      shadow: '#080d12',
      metal: '#6d7e8c',
    },
    silhouette: {
      scale: 0.95,
      shoulderWidth: 11,
      hipWidth: 9,
      armLength: 16,
      legLength: 17,
      headRadius: 5.8,
      stanceWidth: 6,
      torsoHeight: 17,
      hunch: 0.05,
      coatLength: 13,
      hairVolume: 3.8,
    },
    costume: {
      coatShape: 'silent-cloak',
      sleeveShape: 'long',
      hairShape: 'shadow-fringe',
      boots: true,
      chainTrim: false,
      bandages: false,
      skirtPanels: false,
      tornHem: false,
    },
  },
};

export const FUTURE_CHARACTER_KEYS: CharacterKey[] = ['ryu', 'mika', 'taro'];

export function getEnemyDefinition(type: EnemyType): CharacterDefinition {
  return type === 'heavy'
    ? CHARACTER_DEFINITIONS['fallen-heavy']
    : CHARACTER_DEFINITIONS['fallen-common'];
}
