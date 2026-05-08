import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChoiceTone, DialogueLine, GamePhase, GameResult, GameState, UIState } from './types';
import { CANVAS_W, DIALOGUE_AIKO_MEET, createInitialGameState } from './gameData';
import {
  advanceDialogue,
  fireBondThread,
  fireForcedChain,
  initRain,
  makeChoice,
  playerAttack,
  playerDodge,
  startDialogue,
  startPostCombatDialogue,
  updateGameState,
} from './gameSystems';
import { renderGame } from './gameRenderer';
import {
  getChoiceToneLabel,
  getDialogueSpeakerGlyph,
  getDialogueVisualTone,
} from './DialogueUIAnimator';

interface Props {
  onGameEnd: (result: GameResult) => void;
}

const INTRO_TEXT = '"Depois que o ultimo fio se rompeu, Ren aprendeu a temer qualquer laco que pudesse parecer salvacao."';

export function GameEngine({ onGameEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState>(createInitialGameState());
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const onPhaseChangeRef = useRef<((p: GamePhase) => void) | null>(null);
  const onGameEndRef = useRef<((r: GameResult) => void) | null>(null);
  const dialogueKeyBlockRef = useRef(false);

  const [uiState, setUIState] = useState<UIState>({
    phase: 'INTRO',
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
    introVisible: true,
    combatWave: 0,
    lowStability: false,
    choiceTone: null,
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
    });
  }, []);

  const handlePhaseChange = useCallback((phase: GamePhase) => {
    const gs = gsRef.current;

    if (phase === 'COMBAT') {
      setWaveText('Caidos surgem');
      setTimeout(() => setWaveText(''), 1800);
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

  const handleAdvanceDialogue = useCallback(() => {
    if (dialogueKeyBlockRef.current) return;
    const gs = gsRef.current;
    if (!gs.dialogueActive || gs.awaitingChoice) return;

    dialogueKeyBlockRef.current = true;
    setTimeout(() => {
      dialogueKeyBlockRef.current = false;
    }, 180);

    advanceDialogue(gs, (p) => onPhaseChangeRef.current?.(p), (r) => onGameEndRef.current?.(r));
    syncUI(gs);
  }, [syncUI]);

  const handleChoice = useCallback((effect: 'trust' | 'dependency') => {
    const gs = gsRef.current;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gs = gsRef.current;
    gs.particles = initRain();

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

        {uiState.hintText && !uiState.dialogueActive && (uiState.phase === 'EXPLORE' || uiState.phase === 'COMBAT') && (
          <HintPanel text={uiState.hintText} lowStability={uiState.lowStability} />
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
      </div>
    </div>
  );
}

function HintPanel({ text, lowStability }: { text: string; lowStability: boolean }) {
  return (
    <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none">
      <div
        className="border px-4 py-2 text-[10px] tracking-[0.28em]"
        style={{
          borderColor: lowStability ? 'rgba(251, 113, 133, 0.35)' : 'rgba(59, 130, 246, 0.22)',
          color: lowStability ? 'rgba(253, 164, 175, 0.88)' : 'rgba(191, 219, 254, 0.82)',
          background: lowStability ? 'rgba(40, 8, 16, 0.42)' : 'rgba(8, 16, 30, 0.46)',
          boxShadow: lowStability
            ? '0 0 18px rgba(244, 63, 94, 0.08)'
            : '0 0 18px rgba(59, 130, 246, 0.06)',
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
  onAdvance: () => void;
  onChoice: (e: 'trust' | 'dependency') => void;
  awaitingChoice: boolean;
  choiceTone: ChoiceTone;
}) {
  const [typedText, setTypedText] = useState(awaitingChoice ? line.text : '');
  const tone = getDialogueVisualTone(line);
  const isNarration = tone === 'narration';
  const isSystem = tone === 'system';
  const badgeColor =
    tone === 'aiko' ? 'border-rose-400/40 text-rose-200' :
    tone === 'ren' ? 'border-blue-400/40 text-blue-200' :
    'border-amber-200/30 text-amber-100/80';

  useEffect(() => {
    if (awaitingChoice) {
      setTypedText(line.text);
      return;
    }

    let i = 0;
    setTypedText('');
    const interval = setInterval(() => {
      i++;
      setTypedText(line.text.slice(0, i));
      if (i >= line.text.length) {
        clearInterval(interval);
      }
    }, isNarration ? 24 : 18);

    return () => clearInterval(interval);
  }, [awaitingChoice, isNarration, line.text]);

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
          <div className={`w-10 h-10 flex items-center justify-center border ${badgeColor}`} style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-sm tracking-[0.18em]">{getDialogueSpeakerGlyph(line.speaker)}</span>
          </div>

          <div className="flex-1">
            {line.speaker && (
              <div className={`text-[10px] tracking-[0.35em] mb-2 ${tone === 'aiko' ? 'text-rose-200' : tone === 'ren' ? 'text-blue-200' : 'text-amber-100/80'}`}>
                {line.speaker.toUpperCase()}
              </div>
            )}

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
                        choice.dark
                          ? 'border-rose-700/35 text-rose-100 hover:border-rose-500/60 hover:bg-rose-950/26'
                          : 'border-blue-700/30 text-blue-100 hover:border-blue-400/60 hover:bg-blue-950/24'
                      }`}
                      style={{
                        background: choice.dark ? 'rgba(40, 8, 16, 0.3)' : 'rgba(10, 20, 42, 0.3)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="tracking-[0.05em]">{choice.text}</span>
                        <span className={`text-[10px] uppercase tracking-[0.28em] ${choice.dark ? 'text-rose-300/70' : 'text-blue-300/70'}`}>
                          {getChoiceToneLabel(choice)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!awaitingChoice && (
              <button
                onClick={onAdvance}
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
