export interface NarrativeEchoRequest {
  result: {
    dependency: number;
    trust: number;
    autonomy: number;
    forcedChainCount: number;
    chosenPath: 'trust' | 'dependency' | null;
  };
  ending: {
    title: string;
    text: string;
    aikoLine: string;
  };
}

export type NarrativeEchoTone = 'hopeful' | 'fragile' | 'oppressive';

export interface NarrativeEchoResponse {
  title: string;
  aikoAfterline: string;
  reflection: string;
  tone: NarrativeEchoTone;
  model: string;
  generatedAt: string;
}

export interface NarrativeEchoError {
  error: string;
  detail?: string;
}
