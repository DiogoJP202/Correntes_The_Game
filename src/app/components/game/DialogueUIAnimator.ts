import type { DialogueChoice, DialogueLine } from './types';

export type DialogueVisualTone = 'narration' | 'ren' | 'aiko' | 'lia' | 'system';

export function getDialogueVisualTone(line: DialogueLine): DialogueVisualTone {
  if (!line.speaker) return line.text.startsWith('[') ? 'system' : 'narration';
  if (line.speaker === 'Ren') return 'ren';
  if (line.speaker === 'Aiko') return 'aiko';
  if (line.speaker === 'Lia') return 'lia';
  return 'system';
}

export function getDialogueSpeakerGlyph(speaker: string) {
  if (speaker === 'Ren') return 'R';
  if (speaker === 'Aiko') return 'A';
  if (speaker === 'Lia') return 'L';
  if (!speaker) return 'N';
  return 'S';
}

export function getChoiceToneLabel(choice: DialogueChoice) {
  if (choice.effect === 'memory-vulnerability') return 'vulnerabilidade';
  if (choice.effect === 'memory-burden') return 'sobrecarga';
  if (choice.effect === 'memory-lightness') return 'intimidade';
  return choice.dark ? 'controle' : 'confianca';
}
