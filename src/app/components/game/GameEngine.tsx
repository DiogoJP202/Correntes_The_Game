import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChoiceTone, DialogueChoiceEffect, DialogueLine, GamePhase, GameResult, GameState, UIState } from './types';
import { CANVAS_W, DIALOGUE_AIKO_MEET, MEMORY_SCENE_FINAL_CAPTION, createInitialGameState } from './gameData';
import {
  advanceDialogue,
  fireBondThread,
  fireForcedChain,
  initMemoryParticles,
  interactWithMemoryScene,
  makeChoice,
  playerAttack,
  playerDodge,
  startDialogue,
  triggerMemoryBondEffect,
  startPostCombatDialogue,
  updateGameState,
} from './gameSystems';
import { renderGame } from './gameRenderer';
import {
  getChoiceToneLabel,
  getDialogueSpeakerGlyph,
  getDialogueVisualTone,
} from './DialogueUIAnimator';
import {
  playDialogueAdvanceSound,
  playDialogueBlip,
  playDialogueChoiceSound,
  playDialogueOpenSound,
  playMemoryBondSound,
  playMemoryInteractSound,
  primeDialogueAudio,
  setSceneAmbience,
} from './DialogueAudio';
import { DialoguePortrait } from './DialoguePortrait';

interface Props {
  onGameEnd: (result: GameResult) => void;
}

const INTRO_TEXT = '"Depois que o ultimo fio se rompeu, Ren aprendeu a temer qualquer laco que pudesse parecer salvacao."';

function isMemoryPhase(phase: GamePhase) {
  return (
    phase === 'MEMORY_FADE_IN' ||
    phase === 'MEMORY_EXPLORE' ||
    phase === 'MEMORY_APPROACH' ||
    phase === 'MEMORY_DIALOGUE' ||
    phase === 'MEMORY_OUTRO'
  );
}

export function GameEngine({ onGameEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState>(createInitialGameState());
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const onPhaseChangeRef = useRef<((p: GamePhase) => void) | null>(null);
  const onGameEndRef = useRef<((r: GameResult) => void) | null>(null);
  const dialogueKeyBlockRef = useRef(false);
  const memoryCueRef = useRef('');

  const [uiState, setUIState] = useState<UIState>({
    phase: 'MEMORY_FADE_IN',
    playerHp: 100,
    playerMaxHp: 100,
    playerEnergy: 100,
    playerMaxEnergy: 100,
    playerStability: 100,
    playerMaxStability: 100,
    aikoState: 'scared',
    aikoDependency: 0,
    aikoTrust: 20,
    aikoAutonomy: 50,
    forcedChainCount: 0,
    nearAiko: false,
    hintText: '',
    dialogueActive: false,
    dialogueLine: null,
    awaitingChoice: false,
    aikoPhrase: null,
    introVisible: false,
    combatWave: 0,
    lowStability: false,
    choiceTone: null,
    memoryThought: '',
    isMemoryScene: true,
    fadeAlpha: 1,
    finalCaptionAlpha: 0,
    finalCaptionVisible: false,
  });

  const [introTyped, setIntroTyped] = useState('');
  const [introReady, setIntroReady] = useState(false);
  const [waveText, setWaveText] = useState('');

  onGameEndRef.current = onGameEnd;

  const syncUI = useCallback((gs: GameState) => {
    const player = gs.player;
    const aiko = gs.aiko;
    const currentLine = gs.dialogueActive ? gs.dialogueQueue[gs.dialogueIndex] : null;

    setUIState({
      phase: gs.phase,
      playerHp: player.health,
      playerMaxHp: player.maxHealth,
      playerEnergy: player.eloEnergy,
      playerMaxEnergy: player.maxEloEnergy,
      playerStability: player.stability,
      playerMaxStability: player.maxStability,
      aikoState: aiko.state,
      aikoDependency: aiko.dependency,
      aikoTrust: aiko.trust,
      aikoAutonomy: aiko.autonomy,
      forcedChainCount: player.forcedChainCount,
      nearAiko: gs.nearAiko,
      hintText: gs.hintText,
      dialogueActive: gs.dialogueActive,
      dialogueLine: currentLine || null,
      awaitingChoice: gs.awaitingChoice,
      aikoPhrase: aiko.phrase,
      introVisible: gs.phase === 'INTRO',
      combatWave: gs.combatWave,
      lowStability: player.stability < 35,
      choiceTone: gs.choiceTone,
      memoryThought: gs.memory.thoughtText,
      isMemoryScene: isMemoryPhase(gs.phase),
      fadeAlpha: gs.memory.fadeAlpha,
      finalCaptionAlpha: gs.memory.finalCaptionAlpha,
      finalCaptionVisible: gs.memory.finalCaptionVisible,
    });
  }, []);

  const handlePhaseChange = useCallback((phase: GamePhase) => {
    const gs = gsRef.current;

    if (phase === 'COMBAT') {
      setWaveText('Caidos surgem');
      setTimeout(() => setWaveText(''), 1800);
    }

    if (phase === 'INTRO') {
      setIntroTyped('');
      setIntroReady(false);
    }

    if (phase === 'POST_COMBAT' && !gs.postCombatShown) {
      gs.postCombatShown = true;
      setTimeout(() => {
        startPostCombatDialogue(gsRef.current, (p) => onPhaseChangeRef.current?.(p));
        syncUI(gsRef.current);
      }, 560);
    }

    syncUI(gs);
  }, [syncUI]);

  onPhaseChangeRef.current = handlePhaseChange;

  const handleAdvanceDialogue = useCallback((options?: { silent?: boolean; ignoreAuto?: boolean }) => {
    if (dialogueKeyBlockRef.current) return;
    const gs = gsRef.current;
    if (!gs.dialogueActive || gs.awaitingChoice) return;
    const current = gs.dialogueQueue[gs.dialogueIndex];
    if (current?.autoAdvanceMs && !options?.ignoreAuto) return;

    if (!options?.silent) {
      playDialogueAdvanceSound();
    }
    dialogueKeyBlockRef.current = true;
    setTimeout(() => {
      dialogueKeyBlockRef.current = false;
    }, 180);

    advanceDialogue(gs, (p) => onPhaseChangeRef.current?.(p), (r) => onGameEndRef.current?.(r));
    syncUI(gs);
  }, [syncUI]);

  const handleChoice = useCallback((effect: DialogueChoiceEffect) => {
    const gs = gsRef.current;
    const tone =
      effect === 'memory-lightness' ? 'intimacy' :
      effect === 'trust' || effect === 'memory-vulnerability' ? 'trust' :
      'dependency';
    playDialogueChoiceSound(tone);
    makeChoice(gs, effect, (p) => onPhaseChangeRef.current?.(p));
    syncUI(gs);
  }, [syncUI]);

  useEffect(() => {
    if (uiState.phase !== 'INTRO') return;

    let i = 0;
    const interval = setInterval(() => {
      if (i <= INTRO_TEXT.length) {
        setIntroTyped(INTRO_TEXT.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIntroReady(true), 700);
      }
    }, 34);

    return () => clearInterval(interval);
  }, [uiState.phase]);

  useEffect(() => {
    if (uiState.phase === 'COMBAT' && uiState.combatWave > 1) {
      setWaveText(`Onda ${uiState.combatWave}`);
      const timer = setTimeout(() => setWaveText(''), 1800);
      return () => clearTimeout(timer);
    }
  }, [uiState.combatWave, uiState.phase]);

  useEffect(() => {
    if (uiState.phase === 'MEMORY_EXPLORE' || uiState.phase === 'MEMORY_APPROACH') {
      setSceneAmbience('memory-explore');
    } else if (uiState.phase === 'MEMORY_DIALOGUE' || uiState.phase === 'MEMORY_OUTRO') {
      setSceneAmbience('memory-dialogue');
    } else {
      setSceneAmbience('none');
    }
  }, [uiState.phase]);

  useEffect(() => {
    const gs = gsRef.current;
    if (gs.phase !== 'MEMORY_DIALOGUE' || !gs.dialogueActive) return;

    const line = gs.dialogueQueue[gs.dialogueIndex];
    if (!line) return;

    const cueKey = `${gs.phase}:${gs.dialogueIndex}:${line.speaker}:${line.text}`;
    if (memoryCueRef.current === cueKey) return;
    memoryCueRef.current = cueKey;

    const revealDelay = Math.min(1200, Math.max(460, line.text.length * 18 + 120));
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (line.text === 'Se for de verdade... ja esta durando.') {
      timer = setTimeout(() => {
        triggerMemoryBondEffect(gs, 'first');
        playMemoryBondSound('first');
        syncUI(gs);
      }, revealDelay);
    } else if (line.text === 'Nem que seja so o silencio.') {
      timer = setTimeout(() => {
        triggerMemoryBondEffect(gs, 'stable');
        playMemoryBondSound('stable');
        syncUI(gs);
      }, revealDelay);
    } else if (line.text === 'So cuidado para nao confundir forca com prisao.') {
      timer = setTimeout(() => {
        triggerMemoryBondEffect(gs, 'strained');
        playMemoryBondSound('strained');
        syncUI(gs);
      }, revealDelay);
    } else if (line.text === 'Eu conheco o suficiente para ficar.') {
      timer = setTimeout(() => {
        triggerMemoryBondEffect(gs, 'warm');
        playMemoryBondSound('warm');
        syncUI(gs);
      }, revealDelay);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [uiState.dialogueLine, uiState.phase, syncUI]);

  useEffect(() => {
    const gs = gsRef.current;
    if (gs.phase === 'MEMORY_OUTRO' && gs.memory.finalCaptionVisible && memoryCueRef.current !== 'memory-final') {
      memoryCueRef.current = 'memory-final';
      playMemoryBondSound('final');
      syncUI(gs);
    }
  }, [uiState.finalCaptionVisible, uiState.phase, syncUI]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gs = gsRef.current;
    gs.particles = initMemoryParticles();

    let frame = 0;
    const gameLoop = () => {
      updateGameState(
        gsRef.current,
        keysRef.current,
        (p) => onPhaseChangeRef.current?.(p),
        (r) => onGameEndRef.current?.(r),
      );
      renderGame(ctx, gsRef.current);
      frame++;
      if (frame % 6 === 0) syncUI(gsRef.current);
      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [syncUI]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const gs = gsRef.current;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        event.preventDefault();
      }

      keysRef.current.add(key);
      void primeDialogueAudio();

      if (gs.phase === 'INTRO' && introReady) {
        gs.introTimer = 999;
        return;
      }

      if ((key === 'enter' || key === ' ' || key === 'e') && gs.dialogueActive && !gs.awaitingChoice) {
        const isSpaceInCombat = key === ' ' && gs.phase === 'COMBAT';
        if (!isSpaceInCombat) {
          handleAdvanceDialogue();
          return;
        }
      }

      if (gs.phase === 'MEMORY_EXPLORE' && key === 'f') {
        const interacted = interactWithMemoryScene(gs, (p) => onPhaseChangeRef.current?.(p));
        if (interacted) {
          playMemoryInteractSound();
          syncUI(gs);
        }
        return;
      }

      if (gs.phase === 'EXPLORE' && key === 'f' && gs.nearAiko) {
        gs.phase = 'DIALOGUE';
        onPhaseChangeRef.current?.('DIALOGUE');
        startDialogue(gs, DIALOGUE_AIKO_MEET);
        syncUI(gs);
        return;
      }

      if (gs.phase === 'COMBAT') {
        if (key === 'j') playerAttack(gs, false);
        if (key === 'k') playerAttack(gs, true);
        if (key === 'q') fireBondThread(gs);
        if (key === 'e' && !gs.dialogueActive) fireForcedChain(gs);
        if (key === ' ') {
          const dx = (keysRef.current.has('d') || keysRef.current.has('arrowright') ? 1 : 0)
            - (keysRef.current.has('a') || keysRef.current.has('arrowleft') ? 1 : 0);
          const dy = (keysRef.current.has('s') || keysRef.current.has('arrowdown') ? 1 : 0)
            - (keysRef.current.has('w') || keysRef.current.has('arrowup') ? 1 : 0);
          playerDodge(gs, dx, dy);
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleAdvanceDialogue, introReady, syncUI]);

  const aikoStateColor = ({
    scared: 'text-blue-200',
    dependent: 'text-rose-300',
    unstable: 'text-amber-200',
    conscious: 'text-emerald-300',
  } as Record<string, string>)[uiState.aikoState] || 'text-gray-200';

  const aikoStateLabel = ({
    scared: 'Assustada',
    dependent: 'Dependente',
    unstable: 'Instavel',
    conscious: 'Consciente',
  } as Record<string, string>)[uiState.aikoState] || '-';

  const currentLine: DialogueLine | null = uiState.dialogueLine;

  return (
    <div className="relative flex items-center justify-center w-full h-full bg-black">
      <div className="relative" style={{ width: CANVAS_W, maxWidth: '100%' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={500}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />

        {uiState.introVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/86 px-12">
            <div className="max-w-2xl text-center mb-8">
              <span
                className="text-yellow-100/80 text-xl leading-relaxed tracking-wide"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {introTyped}
                <span className="animate-pulse">|</span>
              </span>
            </div>
            {introReady && (
              <button
                className="mt-4 border border-blue-700/35 bg-blue-950/20 px-6 py-2 text-blue-200/80 text-xs tracking-[0.35em] animate-pulse"
                onClick={() => {
                  gsRef.current.introTimer = 999;
                  setIntroReady(false);
                }}
              >
                PRESSIONE UMA TECLA
              </button>
            )}
          </div>
        )}

        {(uiState.phase === 'EXPLORE' || uiState.phase === 'COMBAT' || uiState.phase === 'POST_COMBAT') && (
          <>
            <div className="absolute top-4 left-4 pointer-events-none">
              <div className="border border-slate-800/70 bg-slate-950/65 backdrop-blur-sm px-4 py-3 space-y-2 min-w-[220px] shadow-[0_0_24px_rgba(24,64,140,0.08)]">
                <StatBar label="Vida" value={uiState.playerHp} max={uiState.playerMaxHp} color="#ef4444" />
                <StatBar label="Elo" value={uiState.playerEnergy} max={uiState.playerMaxEnergy} color="#4ea8ff" />
                <StatBar
                  label="Stability"
                  value={uiState.playerStability}
                  max={uiState.playerMaxStability}
                  color={uiState.playerStability > 55 ? '#facc15' : uiState.playerStability > 30 ? '#f97316' : '#fb7185'}
                  danger={uiState.lowStability}
                />
              </div>
            </div>

            <div className="absolute top-4 right-4 pointer-events-none">
              <div className="border border-slate-800/70 bg-slate-950/65 backdrop-blur-sm px-4 py-3 min-w-[220px] shadow-[0_0_24px_rgba(255,114,161,0.06)]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 tracking-[0.3em]">AIKO</div>
                    <div className={`text-sm tracking-[0.18em] ${aikoStateColor}`} style={{ textShadow: '0 0 12px currentColor' }}>
                      {aikoStateLabel}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 tracking-[0.22em]">
                    <div>CORRENTES</div>
                    <div className="text-rose-300">{uiState.forcedChainCount}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <MiniBar label="Confianca" value={uiState.aikoTrust} color="#34d399" />
                  <MiniBar label="Dependencia" value={uiState.aikoDependency} color={uiState.aikoDependency > 55 ? '#fb7185' : '#fb923c'} />
                  <MiniBar label="Autonomia" value={uiState.aikoAutonomy} color="#60a5fa" />
                </div>
              </div>
            </div>
          </>
        )}

        {uiState.hintText && !uiState.dialogueActive && (uiState.phase === 'EXPLORE' || uiState.phase === 'COMBAT' || uiState.isMemoryScene) && (
          <HintPanel text={uiState.hintText} lowStability={uiState.lowStability} memoryTone={uiState.isMemoryScene} />
        )}

        {uiState.memoryThought && uiState.isMemoryScene && (
          <MemoryThought text={uiState.memoryThought} />
        )}

        {uiState.phase === 'COMBAT' && uiState.combatWave > 0 && (
          <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
            <div className="rotate-[-90deg] origin-left text-[10px] text-slate-500 tracking-[0.35em]">
              ONDA {uiState.combatWave}/3
            </div>
          </div>
        )}

        {waveText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-2xl tracking-[0.35em] text-rose-300"
              style={{ textShadow: '0 0 36px rgba(255,72,72,0.6)', fontFamily: 'Georgia, serif' }}
            >
              {waveText}
            </div>
          </div>
        )}

        {uiState.aikoPhrase && uiState.phase === 'COMBAT' && (
          <div className="absolute right-5 pointer-events-none" style={{ bottom: 214, maxWidth: 220 }}>
            <div className="border border-rose-900/30 bg-rose-950/12 px-3 py-2 text-rose-200 text-xs italic text-right leading-relaxed shadow-[0_0_18px_rgba(255,120,170,0.08)]">
              "{uiState.aikoPhrase}"
            </div>
          </div>
        )}

        {uiState.dialogueActive && currentLine && (
          <DialogueBox
            line={currentLine}
            onAdvance={handleAdvanceDialogue}
            onChoice={handleChoice}
            awaitingChoice={uiState.awaitingChoice}
            choiceTone={uiState.choiceTone}
          />
        )}

        {uiState.finalCaptionVisible && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none px-16"
            style={{ opacity: uiState.finalCaptionAlpha, transition: 'opacity 600ms ease' }}
          >
            <div
              className="text-center text-[20px] text-amber-50/90 leading-relaxed"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                textShadow: '0 0 28px rgba(255,223,196,0.22)',
              }}
            >
              {MEMORY_SCENE_FINAL_CAPTION}
            </div>
          </div>
        )}

        {uiState.fadeAlpha > 0.001 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: uiState.fadeAlpha,
              background: 'linear-gradient(180deg, rgba(8,6,8,1) 0%, rgba(18,12,10,1) 100%)',
              transition: 'opacity 120ms linear',
            }}
          />
        )}
      </div>
    </div>
  );
}

function HintPanel({ text, lowStability, memoryTone }: { text: string; lowStability: boolean; memoryTone?: boolean }) {
  return (
    <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none">
      <div
        className="border px-4 py-2 text-[10px] tracking-[0.28em]"
        style={{
          borderColor: memoryTone
            ? 'rgba(255, 214, 182, 0.28)'
            : lowStability
              ? 'rgba(251, 113, 133, 0.35)'
              : 'rgba(59, 130, 246, 0.22)',
          color: memoryTone
            ? 'rgba(255, 234, 214, 0.9)'
            : lowStability
              ? 'rgba(253, 164, 175, 0.88)'
              : 'rgba(191, 219, 254, 0.82)',
          background: memoryTone
            ? 'rgba(58, 32, 20, 0.34)'
            : lowStability
              ? 'rgba(40, 8, 16, 0.42)'
              : 'rgba(8, 16, 30, 0.46)',
          boxShadow: memoryTone
            ? '0 0 22px rgba(255, 190, 132, 0.08)'
            : lowStability
              ? '0 0 18px rgba(244, 63, 94, 0.08)'
              : '0 0 18px rgba(59, 130, 246, 0.06)',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function MemoryThought({ text }: { text: string }) {
  return (
    <div className="absolute left-0 right-0 flex justify-center pointer-events-none px-10" style={{ bottom: 136 }}>
      <div
        className="max-w-xl text-center text-[15px] text-amber-50/84 italic leading-relaxed px-5 py-3 border"
        style={{
          fontFamily: 'Georgia, serif',
          borderColor: 'rgba(255,220,192,0.18)',
          background: 'rgba(50,28,20,0.22)',
          boxShadow: '0 0 24px rgba(255,198,156,0.05)',
          textShadow: '0 0 18px rgba(255,228,198,0.12)',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
  danger,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  danger?: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, value / max));

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] tracking-[0.18em] text-slate-400 mb-1">
        <span>{label}</span>
        <span className={danger ? 'text-rose-300' : 'text-slate-300'}>{Math.ceil(value)}</span>
      </div>
      <div className="h-2 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800/70">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${ratio * 100}%`,
            background: color,
            boxShadow: `0 0 14px ${color}66`,
            transform: danger ? `translateX(${Math.sin(value) * 0.6}px)` : 'translateX(0)',
          }}
        />
      </div>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  const ratio = Math.max(0, Math.min(1, value / 100));
  return (
    <div>
      <div className="flex justify-between text-[9px] text-slate-500 tracking-[0.16em] mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-slate-900/90 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${ratio * 100}%`, background: color, boxShadow: `0 0 12px ${color}55` }}
        />
      </div>
    </div>
  );
}

function DialogueBox({
  line,
  onAdvance,
  onChoice,
  awaitingChoice,
  choiceTone,
}: {
  line: DialogueLine;
  onAdvance: (options?: { silent?: boolean; ignoreAuto?: boolean }) => void;
  onChoice: (e: DialogueChoiceEffect) => void;
  awaitingChoice: boolean;
  choiceTone: ChoiceTone;
}) {
  const [typedText, setTypedText] = useState(awaitingChoice ? line.text : '');
  const tone = getDialogueVisualTone(line);
  const isNarration = tone === 'narration';
  const isSystem = tone === 'system';
  const isAutoLine = !awaitingChoice && typeof line.autoAdvanceMs === 'number';
  const portraitSpeaker = line.speaker || (isSystem ? 'Sistema' : 'Narracao');
  const badgeColor =
    tone === 'aiko' ? 'border-rose-400/40 text-rose-200' :
    tone === 'lia' ? 'border-amber-300/45 text-amber-100' :
    tone === 'ren' ? 'border-blue-400/40 text-blue-200' :
    'border-amber-200/30 text-amber-100/80';

  useEffect(() => {
    playDialogueOpenSound(line.speaker);
    if (awaitingChoice) {
      setTypedText(line.text);
      return;
    }

    let i = 0;
    setTypedText('');
    let autoTimer: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      i++;
      const nextText = line.text.slice(0, i);
      const latestChar = line.text.charAt(Math.max(0, i - 1));
      setTypedText(nextText);
      if (latestChar && /\S/.test(latestChar) && i % (isNarration ? 4 : 2) === 0) {
        playDialogueBlip(line.speaker);
      }
      if (i >= line.text.length) {
        clearInterval(interval);
        if (line.autoAdvanceMs) {
          autoTimer = setTimeout(() => onAdvance({ silent: true, ignoreAuto: true }), line.autoAdvanceMs);
        }
      }
    }, isNarration ? 24 : 18);

    return () => {
      clearInterval(interval);
      if (autoTimer) clearTimeout(autoTimer);
    };
  }, [awaitingChoice, isNarration, line.autoAdvanceMs, line.speaker, line.text, onAdvance]);

  return (
    <div className="absolute bottom-0 left-0 right-0">
      <div
        className="px-6 pt-10 pb-5"
        style={{
          background: 'linear-gradient(to top, rgba(2,4,12,0.98) 0%, rgba(2,4,12,0.9) 72%, rgba(2,4,12,0.22) 100%)',
          boxShadow: choiceTone === 'dependency'
            ? '0 -20px 40px rgba(120, 16, 38, 0.18) inset'
            : choiceTone === 'trust'
              ? '0 -20px 40px rgba(28, 72, 138, 0.14) inset'
              : 'none',
          minHeight: 160,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <DialoguePortrait
              speaker={line.speaker}
              tone={tone}
              speaking={!awaitingChoice && typedText.length < line.text.length}
            />
            <div className={`w-10 h-10 flex items-center justify-center border ${badgeColor}`} style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-sm tracking-[0.18em]">{getDialogueSpeakerGlyph(line.speaker)}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className={`text-[10px] tracking-[0.35em] mb-1 ${tone === 'aiko' ? 'text-rose-200' : tone === 'lia' ? 'text-amber-100' : tone === 'ren' ? 'text-blue-200' : 'text-amber-100/80'}`}>
              {portraitSpeaker.toUpperCase()}
            </div>
            <div className="text-[9px] text-slate-500 tracking-[0.2em] mb-3">
              {tone === 'aiko' ? 'presenca fragil' : tone === 'lia' ? 'presenca escolhida' : tone === 'ren' ? 'voz contida' : isSystem ? 'eco do sistema' : 'narracao interna'}
            </div>

            {!awaitingChoice && (
              <div
                className={`mb-4 ${
                  isSystem ? 'text-xs text-blue-200/78 tracking-[0.08em]' :
                  isNarration ? 'text-base text-yellow-100/68 italic leading-relaxed' :
                  'text-[15px] text-slate-100 leading-relaxed'
                }`}
                style={isNarration ? { fontFamily: 'Georgia, serif' } : {}}
              >
                {typedText}
                {typedText.length < line.text.length && <span className="animate-pulse">|</span>}
              </div>
            )}

            {awaitingChoice && line.choices && (
              <div>
                <div className="text-[11px] text-slate-400 tracking-[0.18em] mb-4 italic">{line.text}</div>
                <div className="space-y-3">
                  {line.choices.map((choice) => (
                    <button
                      key={choice.text}
                      onClick={() => onChoice(choice.effect)}
                      className={`block w-full text-left px-4 py-3 border transition-all duration-200 ${
                        choice.effect === 'memory-lightness'
                          ? 'border-amber-500/30 text-amber-50 hover:border-amber-300/55 hover:bg-amber-950/18'
                          : choice.dark
                            ? 'border-rose-700/35 text-rose-100 hover:border-rose-500/60 hover:bg-rose-950/26'
                            : 'border-blue-700/30 text-blue-100 hover:border-blue-400/60 hover:bg-blue-950/24'
                      }`}
                      style={{
                        background:
                          choice.effect === 'memory-lightness'
                            ? 'rgba(54, 28, 14, 0.28)'
                            : choice.dark
                              ? 'rgba(40, 8, 16, 0.3)'
                              : 'rgba(10, 20, 42, 0.3)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="tracking-[0.05em]">{choice.text}</span>
                        <span className={`text-[10px] uppercase tracking-[0.28em] ${
                          choice.effect === 'memory-lightness'
                            ? 'text-amber-200/80'
                            : choice.dark
                              ? 'text-rose-300/70'
                              : 'text-blue-300/70'
                        }`}>
                          {getChoiceToneLabel(choice)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!awaitingChoice && !isAutoLine && (
              <button
                onClick={() => onAdvance()}
                className="text-[10px] text-slate-500 tracking-[0.35em] hover:text-slate-300 transition-colors"
              >
                ENTER / E / CLIQUE PARA CONTINUAR
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
