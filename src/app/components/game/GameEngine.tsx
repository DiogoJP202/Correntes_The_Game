import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameState, UIState, GamePhase, GameResult, DialogueLine } from './types';
import { CANVAS_W, CANVAS_H, DIALOGUE_AIKO_MEET, createInitialGameState } from './gameData';
import {
  updateGameState, fireBondThread, fireForcedChain, playerAttack,
  playerDodge, startDialogue, advanceDialogue, makeChoice, startPostCombatDialogue, initRain,
} from './gameSystems';
import { renderGame } from './gameRenderer';

interface Props {
  onGameEnd: (result: GameResult) => void;
}

const INTRO_TEXT = '"Depois que o último fio se rompeu, ele aprendeu a temer qualquer laço verdadeiro."';

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
    playerHp: 100, playerMaxHp: 100,
    playerEnergy: 100, playerMaxEnergy: 100,
    playerStability: 100, playerMaxStability: 100,
    aikoState: 'scared',
    aikoDependency: 0, aikoTrust: 20, aikoAutonomy: 50,
    nearAiko: false,
    hintText: '',
    dialogueActive: false,
    dialogueLine: null,
    awaitingChoice: false,
    aikoPhrase: null,
    introVisible: true,
    combatWave: 0,
  });

  const [introTyped, setIntroTyped] = useState('');
  const [introReady, setIntroReady] = useState(false);
  const [waveText, setWaveText] = useState('');

  onGameEndRef.current = onGameEnd;

  const syncUI = useCallback((gs: GameState) => {
    const p = gs.player;
    const a = gs.aiko;
    const currentLine = gs.dialogueActive ? gs.dialogueQueue[gs.dialogueIndex] : null;
    setUIState({
      phase: gs.phase,
      playerHp: p.health, playerMaxHp: p.maxHealth,
      playerEnergy: p.eloEnergy, playerMaxEnergy: p.maxEloEnergy,
      playerStability: p.stability, playerMaxStability: p.maxStability,
      aikoState: a.state,
      aikoDependency: a.dependency, aikoTrust: a.trust, aikoAutonomy: a.autonomy,
      nearAiko: gs.nearAiko,
      hintText: gs.hintText,
      dialogueActive: gs.dialogueActive,
      dialogueLine: currentLine || null,
      awaitingChoice: gs.awaitingChoice,
      aikoPhrase: a.phrase,
      introVisible: gs.phase === 'INTRO',
      combatWave: gs.combatWave,
    });
  }, []);

  const handlePhaseChange = useCallback((phase: GamePhase) => {
    const gs = gsRef.current;
    if (phase === 'COMBAT') {
      setWaveText('Caídos aparecem!');
      setTimeout(() => setWaveText(''), 2000);
    }
    if (phase === 'POST_COMBAT' && !gs.postCombatShown) {
      gs.postCombatShown = true;
      setTimeout(() => {
        startPostCombatDialogue(gsRef.current, (p) => onPhaseChangeRef.current?.(p));
        syncUI(gsRef.current);
      }, 600);
    }
    syncUI(gs);
  }, [syncUI]);

  onPhaseChangeRef.current = handlePhaseChange;

  const handleAdvanceDialogue = useCallback(() => {
    if (dialogueKeyBlockRef.current) return;
    const gs = gsRef.current;
    if (!gs.dialogueActive || gs.awaitingChoice) return;
    dialogueKeyBlockRef.current = true;
    setTimeout(() => { dialogueKeyBlockRef.current = false; }, 200);
    advanceDialogue(gs, (p) => onPhaseChangeRef.current?.(p), (r) => onGameEndRef.current?.(r));
    syncUI(gs);
  }, [syncUI]);

  const handleChoice = useCallback((effect: 'trust' | 'dependency') => {
    const gs = gsRef.current;
    makeChoice(gs, effect, (p) => onPhaseChangeRef.current?.(p));
    syncUI(gs);
  }, [syncUI]);

  // Typewriter intro effect
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
    }, 36);
    return () => clearInterval(interval);
  }, [uiState.phase]);

  // Wave announcement
  useEffect(() => {
    if (uiState.phase === 'COMBAT' && uiState.combatWave > 1) {
      setWaveText(`Onda ${uiState.combatWave}!`);
      const t = setTimeout(() => setWaveText(''), 2000);
      return () => clearTimeout(t);
    }
  }, [uiState.combatWave, uiState.phase]);

  // Main game loop
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
      if (frame % 8 === 0) syncUI(gsRef.current);
      rafRef.current = requestAnimationFrame(gameLoop);
    };
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [syncUI]);

  // Keyboard input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const gs = gsRef.current;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
      keysRef.current.add(key);

      // Skip intro
      if (gs.phase === 'INTRO' && introReady) {
        gs.introTimer = 999;
        return;
      }

      // Advance dialogue with Enter/Space/E (but not in combat unless dialogue active)
      if ((key === 'enter' || key === ' ' || key === 'e') && gs.dialogueActive && !gs.awaitingChoice) {
        const isSpaceInCombat = key === ' ' && gs.phase === 'COMBAT';
        if (!isSpaceInCombat) {
          handleAdvanceDialogue();
          return;
        }
      }

      // Explore: interact
      if (gs.phase === 'EXPLORE' && key === 'f' && gs.nearAiko) {
        gs.phase = 'DIALOGUE';
        onPhaseChangeRef.current?.('DIALOGUE');
        startDialogue(gs, DIALOGUE_AIKO_MEET);
        syncUI(gs);
        return;
      }

      // Combat abilities
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
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleAdvanceDialogue, syncUI, introReady]);

  const aikoStateColor = ({
    scared: 'text-blue-300',
    dependent: 'text-red-400',
    unstable: 'text-orange-400',
    conscious: 'text-emerald-400',
  } as Record<string, string>)[uiState.aikoState] || 'text-gray-300';

  const aikoStateLabel = ({
    scared: 'Assustada',
    dependent: 'Dependente',
    unstable: 'Instável',
    conscious: 'Consciente',
  } as Record<string, string>)[uiState.aikoState] || '—';

  const currentLine: DialogueLine | null = uiState.dialogueLine;

  return (
    <div className="relative flex items-center justify-center w-full h-full bg-black">
      <div className="relative" style={{ width: CANVAS_W, maxWidth: '100%' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />

        {/* ── INTRO OVERLAY ─────────────────────────────────────────────────── */}
        {uiState.introVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 px-12">
            <div className="mb-6 text-center">
              <span
                className="text-yellow-100/80 text-xl leading-relaxed tracking-wider"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {introTyped}
                <span className="animate-pulse">|</span>
              </span>
            </div>
            {introReady && (
              <button
                className="mt-6 text-blue-300/70 text-sm tracking-widest animate-pulse border border-blue-800/40 px-6 py-2"
                onClick={() => { gsRef.current.introTimer = 999; setIntroReady(false); }}
              >
                PRESSIONE QUALQUER TECLA
              </button>
            )}
          </div>
        )}

        {/* ── HUD ─────────────────────────────────────────────────────────── */}
        {(uiState.phase === 'EXPLORE' || uiState.phase === 'COMBAT' || uiState.phase === 'POST_COMBAT') && (
          <>
            <div className="absolute top-3 left-3 space-y-1.5 pointer-events-none">
              <StatBar label="VIDA" value={uiState.playerHp} max={uiState.playerMaxHp} color="bg-red-600" />
              <StatBar label="ELO" value={uiState.playerEnergy} max={uiState.playerMaxEnergy} color="bg-blue-500" />
              <StatBar
                label="ESTAB"
                value={uiState.playerStability}
                max={uiState.playerMaxStability}
                color={uiState.playerStability > 50 ? 'bg-yellow-400' : uiState.playerStability > 25 ? 'bg-orange-500' : 'bg-red-500'}
              />
            </div>

            {/* Aiko status – top right */}
            <div className="absolute top-3 right-3 text-right pointer-events-none">
              <div className="text-[9px] text-gray-600 tracking-widest mb-1">AIKO</div>
              <div className={`text-sm tracking-wide ${aikoStateColor}`} style={{ textShadow: '0 0 8px currentColor' }}>
                {aikoStateLabel}
              </div>
              <div className="mt-2 w-28 ml-auto space-y-1">
                <MiniBar label="CONFIANÇA" value={uiState.aikoTrust} color="#22c55e" />
                <MiniBar label="DEPENDÊNCIA" value={uiState.aikoDependency} color={uiState.aikoDependency > 60 ? '#ef4444' : '#f97316'} />
              </div>
            </div>
          </>
        )}

        {/* Combat hint bar */}
        {uiState.phase === 'COMBAT' && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none">
            <div className="text-[9px] text-gray-700 tracking-widest flex gap-3">
              <span>J Ataque</span>
              <span>K Pesado</span>
              <span style={{ color: '#3366cc' }}>Q Fio de Vínculo</span>
              <span style={{ color: '#cc4400' }}>E Corrente Forçada</span>
              <span>ESPAÇO Esquiva</span>
            </div>
          </div>
        )}

        {/* Wave counter */}
        {uiState.phase === 'COMBAT' && uiState.combatWave > 0 && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none">
            <div className="text-[9px] text-gray-700 tracking-widest">ONDA {uiState.combatWave}/3</div>
          </div>
        )}

        {/* Wave announcement */}
        {waveText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-red-400 text-2xl tracking-[0.3em]"
              style={{ textShadow: '0 0 30px #ff2200, 0 0 60px #ff000040', fontFamily: 'Georgia, serif' }}
            >
              {waveText}
            </div>
          </div>
        )}

        {/* Explore move hint */}
        {uiState.phase === 'EXPLORE' && (
          <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center pointer-events-none gap-1">
            <div className="text-[10px] text-gray-700 tracking-widest">WASD — Mover</div>
            {uiState.nearAiko && (
              <div className="text-blue-300 text-sm tracking-widest animate-pulse" style={{ textShadow: '0 0 12px #88aaff' }}>
                F — Interagir com Aiko
              </div>
            )}
          </div>
        )}

        {/* Aiko floating phrase */}
        {uiState.aikoPhrase && uiState.phase === 'COMBAT' && (
          <div className="absolute right-5 pointer-events-none" style={{ bottom: '210px', maxWidth: '200px' }}>
            <div className="text-pink-300 text-xs italic text-right leading-relaxed" style={{ textShadow: '0 0 10px #ff88aa' }}>
              "{uiState.aikoPhrase}"
            </div>
          </div>
        )}

        {/* ── DIALOGUE BOX ──────────────────────────────────────────────────── */}
        {uiState.dialogueActive && currentLine && (
          <DialogueBox
            line={currentLine}
            onAdvance={handleAdvanceDialogue}
            onChoice={handleChoice}
            awaitingChoice={uiState.awaitingChoice}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const ratio = Math.max(0, Math.min(1, value / max));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-700 tracking-widest w-9">{label}</span>
      <div className="w-24 h-1.5 bg-gray-900 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-200`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="text-[9px] text-gray-800 w-5 text-right">{Math.ceil(value)}</span>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[8px] text-gray-700 mb-0.5">
        <span>{label}</span><span>{Math.round(value)}</span>
      </div>
      <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function DialogueBox({ line, onAdvance, onChoice, awaitingChoice }: {
  line: DialogueLine;
  onAdvance: () => void;
  onChoice: (e: 'trust' | 'dependency') => void;
  awaitingChoice: boolean;
}) {
  const speakerColors: Record<string, string> = {
    Aiko: 'text-pink-300',
    Ren: 'text-blue-300',
    '': 'text-yellow-200',
  };
  const isResultInfo = line.text.startsWith('[');
  const isNarration = !line.speaker;

  return (
    <div
      className="absolute bottom-0 left-0 right-0"
      style={{
        background: 'linear-gradient(to top, rgba(3,4,12,0.97) 0%, rgba(3,4,12,0.88) 75%, transparent 100%)',
        padding: '18px 24px 22px',
        minHeight: '110px',
      }}
    >
      {line.speaker && (
        <div
          className={`text-[10px] tracking-[0.35em] mb-2 ${speakerColors[line.speaker] || 'text-white'}`}
          style={{ textShadow: '0 0 10px currentColor' }}
        >
          {line.speaker.toUpperCase()}
        </div>
      )}

      {!awaitingChoice && (
        <div
          className={`leading-relaxed mb-3 ${
            isResultInfo ? 'text-xs text-blue-300/80 tracking-wide' :
            isNarration ? 'text-base text-yellow-100/65 italic' : 'text-sm text-gray-200'
          }`}
          style={isNarration ? { fontFamily: 'Georgia, serif' } : {}}
        >
          {line.text}
        </div>
      )}

      {awaitingChoice && line.choices && (
        <div className="mt-1">
          <div className="text-[10px] text-gray-500 tracking-widest mb-3 italic">{line.text}</div>
          <div className="space-y-2">
            {line.choices.map((choice) => (
              <button
                key={choice.text}
                onClick={() => onChoice(choice.effect)}
                className={`block w-full text-left text-sm px-4 py-2.5 border transition-all duration-200 ${
                  choice.dark
                    ? 'border-red-800/40 text-red-300 hover:border-red-600 hover:bg-red-950/30'
                    : 'border-blue-800/40 text-blue-200 hover:border-blue-500 hover:bg-blue-950/30'
                }`}
              >
                <span className={`mr-2 ${choice.dark ? 'text-red-600' : 'text-blue-500'}`}>▸</span>
                {choice.text}
                {choice.dark && <span className="ml-2 text-[10px] text-red-800/60">— forçar vínculo</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {!awaitingChoice && (
        <button
          onClick={onAdvance}
          className="text-gray-700 text-[10px] tracking-widest hover:text-gray-500 transition-colors"
        >
          ENTER / CLIQUE para continuar ▸
        </button>
      )}
    </div>
  );
}
