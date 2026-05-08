type DialogueSpeaker = 'Ren' | 'Aiko' | 'Narration' | 'System';

interface VoiceConfig {
  wave: OscillatorType;
  frequency: number;
  spread: number;
  duration: number;
  volume: number;
  filter: number;
}

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
const lastBlipAt: Record<DialogueSpeaker, number> = {
  Ren: 0,
  Aiko: 0,
  Narration: 0,
  System: 0,
};

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;

  if (!audioContext) {
    audioContext = new AudioCtor();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(audioContext.destination);
  }

  return audioContext;
}

function speakerFromLabel(label: string): DialogueSpeaker {
  if (label === 'Ren') return 'Ren';
  if (label === 'Aiko') return 'Aiko';
  if (!label) return 'Narration';
  return 'System';
}

function getVoiceConfig(speaker: DialogueSpeaker): VoiceConfig {
  switch (speaker) {
    case 'Ren':
      return { wave: 'triangle', frequency: 188, spread: 16, duration: 0.06, volume: 0.034, filter: 1200 };
    case 'Aiko':
      return { wave: 'sine', frequency: 362, spread: 20, duration: 0.05, volume: 0.03, filter: 1600 };
    case 'System':
      return { wave: 'square', frequency: 520, spread: 32, duration: 0.045, volume: 0.022, filter: 2100 };
    default:
      return { wave: 'triangle', frequency: 280, spread: 14, duration: 0.07, volume: 0.018, filter: 900 };
  }
}

function playTone(
  frequency: number,
  duration: number,
  wave: OscillatorType,
  volume: number,
  filterFrequency: number,
  whenOffset = 0,
  glideTo?: number,
) {
  const ctx = getAudioContext();
  if (!ctx || !masterGain || ctx.state !== 'running') return;

  const startAt = ctx.currentTime + whenOffset;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  if (glideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(glideTo, startAt + duration);
  }

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFrequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

export async function primeDialogueAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

export function playDialogueOpenSound(label: string) {
  const speaker = speakerFromLabel(label);
  if (speaker === 'Aiko') {
    playTone(380, 0.16, 'sine', 0.028, 1800, 0, 470);
    playTone(620, 0.12, 'triangle', 0.013, 2000, 0.04, 700);
    return;
  }
  if (speaker === 'Ren') {
    playTone(205, 0.16, 'triangle', 0.03, 1200, 0, 250);
    playTone(312, 0.1, 'sine', 0.012, 1600, 0.03, 340);
    return;
  }
  playTone(290, 0.18, 'triangle', 0.02, 950, 0, 260);
  playTone(520, 0.12, 'sine', 0.01, 1800, 0.06, 620);
}

export function playDialogueAdvanceSound() {
  playTone(240, 0.06, 'triangle', 0.018, 1100);
  playTone(410, 0.04, 'sine', 0.009, 1700, 0.015);
}

export function playDialogueChoiceSound(effect: 'trust' | 'dependency') {
  if (effect === 'trust') {
    playTone(330, 0.08, 'sine', 0.02, 1600, 0, 380);
    playTone(440, 0.11, 'triangle', 0.016, 1800, 0.05, 540);
    return;
  }

  playTone(280, 0.08, 'square', 0.018, 1400, 0, 230);
  playTone(180, 0.12, 'triangle', 0.014, 1000, 0.04, 150);
}

export function playDialogueBlip(label: string) {
  const speaker = speakerFromLabel(label);
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  if (now - lastBlipAt[speaker] < 0.045) return;
  lastBlipAt[speaker] = now;

  const config = getVoiceConfig(speaker);
  const frequency = config.frequency + (Math.random() - 0.5) * config.spread;
  playTone(frequency, config.duration, config.wave, config.volume, config.filter, 0, frequency * 1.04);
}
