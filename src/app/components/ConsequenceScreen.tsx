import { useState, useEffect } from 'react';
import type { GameResult } from './game/types';

interface Props {
  result: GameResult;
  onRestart: () => void;
}

export function ConsequenceScreen({ result, onRestart }: Props) {
  const [visible, setVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 200);
    const t2 = setTimeout(() => setShowStats(true), 1200);
    const t3 = setTimeout(() => setShowEnd(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isDark = result.dependency > 45 || result.forcedChainCount >= 3;
  const chosenForced = result.chosenPath === 'dependency';

  // Determine ending type
  let endingTitle: string;
  let endingText: string;
  let aikoLine: string;
  let endingColor: string;

  if (isDark && chosenForced) {
    endingTitle = 'Corrente Viva';
    endingText = 'Ela estava viva. Mas algo nela já não era completamente dela.';
    aikoLine = '"Quando você puxa essa corrente... eu sinto como se uma parte minha ficasse com você."';
    endingColor = 'text-red-300';
  } else if (isDark && !chosenForced) {
    endingTitle = 'Fragmento Preso';
    endingText = 'Ela estava segura. Mas algo nela ficou preso.';
    aikoLine = '"Não me deixa para trás..."';
    endingColor = 'text-orange-300';
  } else {
    endingTitle = 'Passo Próprio';
    endingText = 'Ele ainda não sabia proteger sem prender. Mas, por um instante, tentou.';
    aikoLine = '"Eu ainda estou com medo... mas consigo andar."';
    endingColor = 'text-blue-300';
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Rain background effect */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px bg-blue-400/30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: 0,
              height: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 max-w-lg w-full mx-8 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      >
        {/* Game title */}
        <div className="text-gray-600/60 text-[10px] tracking-[0.5em] mb-8">
          FIM DA DEMO — CORRENTES: FRAGMENTOS DE VONTADE
        </div>

        {/* Ending type */}
        <div
          className={`text-2xl tracking-[0.2em] mb-6 ${endingColor}`}
          style={{
            fontFamily: 'Georgia, serif',
            textShadow: '0 0 30px currentColor',
            opacity: showStats ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        >
          {endingTitle}
        </div>

        {/* Aiko's line */}
        <div
          className="text-gray-400 italic text-sm mb-6 leading-relaxed"
          style={{
            fontFamily: 'Georgia, serif',
            opacity: showStats ? 1 : 0,
            transition: 'opacity 0.8s ease 0.2s',
          }}
        >
          {aikoLine}
        </div>

        {/* Consequence text */}
        <div
          className="text-yellow-100/70 text-base mb-8 leading-relaxed"
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            textShadow: '0 0 20px rgba(255,220,100,0.2)',
            opacity: showStats ? 1 : 0,
            transition: 'opacity 0.8s ease 0.4s',
          }}
        >
          "{endingText}"
        </div>

        {/* Stats */}
        <div
          className="border border-gray-800/60 p-6 mb-8 text-left space-y-3"
          style={{
            background: 'rgba(8,10,20,0.8)',
            opacity: showStats ? 1 : 0,
            transition: 'opacity 0.8s ease 0.6s',
          }}
        >
          <div className="text-[10px] text-gray-600 tracking-widest mb-4">ESTADO DE AIKO</div>

          <StatLine label="Confiança" value={result.trust} max={100} color="#22c55e" />
          <StatLine label="Dependência" value={result.dependency} max={100} color={result.dependency > 50 ? '#ef4444' : '#f97316'} />
          <StatLine label="Autonomia" value={result.autonomy} max={100} color="#3b82f6" />

          <div className="pt-3 border-t border-gray-800/40">
            <div className="text-[10px] text-gray-600 tracking-widest mb-2">ESCOLHAS</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                Vínculo inicial:{' '}
                <span className={result.chosenPath === 'trust' ? 'text-blue-400' : 'text-red-400'}>
                  {result.chosenPath === 'trust' ? '"Então caminha comigo."' : '"Você precisa de mim."'}
                </span>
              </div>
              <div>
                Correntes forçadas:{' '}
                <span className={result.forcedChainCount >= 3 ? 'text-red-400' : result.forcedChainCount > 0 ? 'text-orange-400' : 'text-blue-400'}>
                  {result.forcedChainCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Final tagline */}
        <div
          className="text-gray-500/80 text-sm italic mb-10"
          style={{
            fontFamily: 'Georgia, serif',
            opacity: showEnd ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        >
          "Vínculos não são feitos para prender. São feitos para continuar."
        </div>

        {/* Restart button */}
        <button
          onClick={onRestart}
          className="border border-gray-700/60 text-gray-400 px-8 py-3 text-sm tracking-[0.3em] 
            hover:border-blue-700/60 hover:text-blue-300 transition-all duration-300"
          style={{
            opacity: showEnd ? 1 : 0,
            transition: 'opacity 1s ease 0.3s, border-color 0.3s, color 0.3s',
            background: 'rgba(8,10,20,0.6)',
          }}
        >
          VOLTAR AO MENU
        </button>
      </div>
    </div>
  );
}

function StatLine({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const ratio = Math.max(0, Math.min(1, value / max));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${ratio * 100}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
    </div>
  );
}
