import type { DialogueChoice, DialogueLine } from './types';

export type DialogueVisualTone = 'narration' | 'ren' | 'aiko' | 'system';

export function getDialogueVisualTone(line: DialogueLine): DialogueVisualTone {
  if (!line.speaker) return line.text.startsWith('[') ? 'system' : 'narration';
  if (line.speaker === 'Ren') return 'ren';
  if (line.speaker === 'Aiko') return 'aiko';
  return 'system';
}

export function getDialogueSpeakerGlyph(speaker: string) {
  if (speaker === 'Ren') return 'R';
  if (speaker === 'Aiko') return 'A';
  return 'E';
}

export function getChoiceToneLabel(choice: DialogueChoice) {
  return choice.dark ? 'controle' : 'confianca';
}
