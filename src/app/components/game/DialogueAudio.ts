type DialogueSpeaker = 'Ren' | 'Aiko' | 'Narration' | 'System';

interface VoiceConfig {
  wave: OscillatorType;
  secondaryWave?: OscillatorType;
  frequency: number;
  spread: number;
  duration: number;
  volume: number;
  filter: number;
  highpass?: number;
  attack: number;
  release: number;
  cadence: number;
  glideMultiplier?: number;
  vibratoRate?: number;
  vibratoDepth?: number;
  noiseVolume?: number;
  noiseFilter?: number;
  harmonic?: number;
  harmonicVolume?: number;
  detune?: number;
}

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
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
    masterGain.gain.value = 0.145;
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
      return {
        wave: 'triangle',
        secondaryWave: 'sawtooth',
        frequency: 172,
        spread: 14,
        duration: 0.07,
        volume: 0.026,
        filter: 980,
        highpass: 120,
        attack: 0.008,
        release: 0.055,
        cadence: 0.052,
        glideMultiplier: 0.985,
        harmonic: 0.5,
        harmonicVolume: 0.34,
        detune: -5,
      };
    case 'Aiko':
      return {
        wave: 'sine',
        secondaryWave: 'triangle',
        frequency: 348,
        spread: 28,
        duration: 0.056,
        volume: 0.022,
        filter: 2100,
        highpass: 240,
        attack: 0.006,
        release: 0.05,
        cadence: 0.043,
        glideMultiplier: 1.08,
        vibratoRate: 8.4,
        vibratoDepth: 7,
        noiseVolume: 0.0032,
        noiseFilter: 2800,
        harmonic: 2.02,
        harmonicVolume: 0.2,
        detune: 6,
      };
    case 'System':
      return {
        wave: 'square',
        secondaryWave: 'triangle',
        frequency: 492,
        spread: 24,
        duration: 0.046,
        volume: 0.014,
        filter: 2600,
        highpass: 360,
        attack: 0.003,
        release: 0.035,
        cadence: 0.038,
        glideMultiplier: 0.95,
        vibratoRate: 12,
        vibratoDepth: 4,
        noiseVolume: 0.002,
        noiseFilter: 4200,
        harmonic: 2,
        harmonicVolume: 0.12,
      };
    default:
      return {
        wave: 'triangle',
        secondaryWave: 'sine',
        frequency: 248,
        spread: 10,
        duration: 0.082,
        volume: 0.014,
        filter: 1280,
        highpass: 140,
        attack: 0.012,
        release: 0.07,
        cadence: 0.06,
        glideMultiplier: 1.02,
        vibratoRate: 3.1,
        vibratoDepth: 2.8,
        noiseVolume: 0.0026,
        noiseFilter: 1750,
        harmonic: 1.5,
        harmonicVolume: 0.18,
        detune: 2,
      };
  }
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getNoiseBuffer(ctx: AudioContext) {
  if (noiseBuffer) return noiseBuffer;

  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) {
    channel[i] = randomRange(-1, 1) * (1 - i / channel.length);
  }

  noiseBuffer = buffer;
  return buffer;
}

interface ToneOptions {
  frequency: number;
  duration: number;
  wave: OscillatorType;
  volume: number;
  filterFrequency: number;
  whenOffset?: number;
  glideTo?: number;
  attack?: number;
  release?: number;
  highpassFrequency?: number;
  vibratoRate?: number;
  vibratoDepth?: number;
  detune?: number;
}

function playTone({
  frequency,
  duration,
  wave,
  volume,
  filterFrequency,
  whenOffset = 0,
  glideTo,
  attack = 0.01,
  release = 0.03,
  highpassFrequency,
  vibratoRate,
  vibratoDepth,
  detune = 0,
}: ToneOptions) {
  const ctx = getAudioContext();
  if (!ctx || !masterGain || ctx.state !== 'running') return;

  const startAt = ctx.currentTime + whenOffset;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const highpass = ctx.createBiquadFilter();
  const lowpass = ctx.createBiquadFilter();

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.detune.setValueAtTime(detune, startAt);
  if (glideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), startAt + duration);
  }

  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(highpassFrequency ?? 20, startAt);

  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(filterFrequency, startAt);

  if (vibratoRate && vibratoDepth) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(vibratoRate, startAt);
    lfoGain.gain.setValueAtTime(vibratoDepth, startAt);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.start(startAt);
    lfo.stop(startAt + duration + release + 0.02);
  }

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration + release);

  oscillator.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(masterGain);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + release + 0.03);
}

function playNoiseBurst(
  duration: number,
  volume: number,
  lowpassFrequency: number,
  highpassFrequency: number,
  whenOffset = 0,
) {
  const ctx = getAudioContext();
  if (!ctx || !masterGain || ctx.state !== 'running') return;

  const startAt = ctx.currentTime + whenOffset;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const highpass = ctx.createBiquadFilter();
  const lowpass = ctx.createBiquadFilter();

  source.buffer = getNoiseBuffer(ctx);

  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(highpassFrequency, startAt);

  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(lowpassFrequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(masterGain);

  source.start(startAt);
  source.stop(startAt + duration + 0.03);
}

function playVoiceBlip(speaker: DialogueSpeaker) {
  const config = getVoiceConfig(speaker);
  const frequency = config.frequency + randomRange(-config.spread, config.spread);
  const glideTo = frequency * (config.glideMultiplier ?? 1.04);

  playTone({
    frequency,
    duration: config.duration,
    wave: config.wave,
    volume: config.volume,
    filterFrequency: config.filter,
    attack: config.attack,
    release: config.release,
    highpassFrequency: config.highpass,
    vibratoRate: config.vibratoRate,
    vibratoDepth: config.vibratoDepth,
    detune: config.detune,
    glideTo,
  });

  if (config.secondaryWave && config.harmonic && config.harmonicVolume) {
    playTone({
      frequency: frequency * config.harmonic,
      duration: config.duration * 0.92,
      wave: config.secondaryWave,
      volume: config.volume * config.harmonicVolume,
      filterFrequency: config.filter * 0.9,
      attack: config.attack,
      release: config.release,
      highpassFrequency: config.highpass,
      detune: -(config.detune ?? 0),
      glideTo: glideTo * config.harmonic,
    });
  }

  if (config.noiseVolume && config.noiseFilter) {
    playNoiseBurst(
      config.duration + config.release * 0.5,
      config.noiseVolume,
      config.noiseFilter,
      config.highpass ?? 300,
    );
  }
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
    playTone({ frequency: 312, duration: 0.11, wave: 'sine', volume: 0.018, filterFrequency: 1900, highpassFrequency: 260, glideTo: 360, vibratoRate: 8, vibratoDepth: 5 });
    playTone({ frequency: 468, duration: 0.09, wave: 'triangle', volume: 0.008, filterFrequency: 2300, whenOffset: 0.035, highpassFrequency: 300, glideTo: 560 });
    playNoiseBurst(0.09, 0.0022, 3000, 1200, 0.02);
    return;
  }
  if (speaker === 'Ren') {
    playTone({ frequency: 184, duration: 0.12, wave: 'triangle', volume: 0.022, filterFrequency: 960, highpassFrequency: 120, glideTo: 170 });
    playTone({ frequency: 92, duration: 0.1, wave: 'sine', volume: 0.008, filterFrequency: 620, whenOffset: 0.01, highpassFrequency: 40, glideTo: 88 });
    playTone({ frequency: 278, duration: 0.06, wave: 'sawtooth', volume: 0.0045, filterFrequency: 1200, whenOffset: 0.03, highpassFrequency: 180, glideTo: 250 });
    return;
  }
  if (speaker === 'System') {
    playTone({ frequency: 420, duration: 0.1, wave: 'square', volume: 0.012, filterFrequency: 2400, highpassFrequency: 360, glideTo: 400, vibratoRate: 11, vibratoDepth: 4 });
    playTone({ frequency: 690, duration: 0.06, wave: 'triangle', volume: 0.005, filterFrequency: 3400, whenOffset: 0.02, highpassFrequency: 650, glideTo: 760 });
    playNoiseBurst(0.045, 0.0018, 5200, 1600, 0.01);
    return;
  }

  playTone({ frequency: 236, duration: 0.14, wave: 'triangle', volume: 0.013, filterFrequency: 1180, highpassFrequency: 140, glideTo: 250, vibratoRate: 2.8, vibratoDepth: 2.4 });
  playTone({ frequency: 372, duration: 0.1, wave: 'sine', volume: 0.006, filterFrequency: 1600, whenOffset: 0.05, highpassFrequency: 240, glideTo: 390 });
  playNoiseBurst(0.12, 0.002, 1800, 700, 0.015);
}

export function playDialogueAdvanceSound() {
  playTone({ frequency: 218, duration: 0.05, wave: 'triangle', volume: 0.012, filterFrequency: 1100, highpassFrequency: 180, glideTo: 205 });
  playTone({ frequency: 358, duration: 0.035, wave: 'sine', volume: 0.005, filterFrequency: 1700, whenOffset: 0.012, highpassFrequency: 260, glideTo: 392 });
  playNoiseBurst(0.03, 0.0016, 2400, 900);
}

export function playDialogueChoiceSound(effect: 'trust' | 'dependency') {
  if (effect === 'trust') {
    playTone({ frequency: 296, duration: 0.09, wave: 'sine', volume: 0.014, filterFrequency: 1600, highpassFrequency: 220, glideTo: 360 });
    playTone({ frequency: 432, duration: 0.12, wave: 'triangle', volume: 0.01, filterFrequency: 2200, whenOffset: 0.045, highpassFrequency: 280, glideTo: 540, vibratoRate: 5, vibratoDepth: 2 });
    playNoiseBurst(0.07, 0.0018, 2600, 1300, 0.02);
    return;
  }

  playTone({ frequency: 274, duration: 0.09, wave: 'square', volume: 0.013, filterFrequency: 1450, highpassFrequency: 260, glideTo: 232, vibratoRate: 7, vibratoDepth: 3 });
  playTone({ frequency: 176, duration: 0.13, wave: 'triangle', volume: 0.01, filterFrequency: 980, whenOffset: 0.035, highpassFrequency: 140, glideTo: 142 });
  playNoiseBurst(0.08, 0.0026, 2200, 700, 0.015);
}

export function playDialogueBlip(label: string) {
  const speaker = speakerFromLabel(label);
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  const config = getVoiceConfig(speaker);
  if (now - lastBlipAt[speaker] < config.cadence) return;
  lastBlipAt[speaker] = now;
  playVoiceBlip(speaker);
}
