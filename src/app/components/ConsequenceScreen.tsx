import { useEffect, useMemo, useState } from 'react';
import type { GameResult } from './game/types';
import type {
  NarrativeEchoError,
  NarrativeEchoRequest,
  NarrativeEchoResponse,
} from '../../shared/aiEcho';

interface Props {
  result: GameResult;
  onRestart: () => void;
}

interface EndingPresentation {
  title: string;
  text: string;
  aikoLine: string;
  endingColor: string;
}

export function ConsequenceScreen({ result, onRestart }: Props) {
  const [visible, setVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [echo, setEcho] = useState<NarrativeEchoResponse | null>(null);
  const [echoLoading, setEchoLoading] = useState(false);
  const [echoError, setEchoError] = useState<string | null>(null);

  const ending = useMemo(() => getEndingPresentation(result), [result]);
  const rainColumns = useMemo(
    () =>
      Array.from({ length: 30 }, () => ({
        left: `${Math.random() * 100}%`,
        height: `${20 + Math.random() * 60}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${1 + Math.random() * 2}s`,
      })),
    [],
  );

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 200);
    const t2 = setTimeout(() => setShowStats(true), 1200);
    const t3 = setTimeout(() => setShowEnd(true), 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  async function handleGenerateEcho() {
    if (echoLoading) {
      return;
    }

    setEchoLoading(true);
    setEchoError(null);
    setEcho(null);

    const payload: NarrativeEchoRequest = {
      result,
      ending: {
        title: ending.title,
        text: ending.text,
        aikoLine: ending.aikoLine,
      },
    };

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as NarrativeEchoResponse | NarrativeEchoError;

      if (!response.ok) {
        const detail = 'detail' in data && data.detail ? ` ${data.detail}` : '';
        throw new Error(`${'error' in data ? data.error : 'Falha ao gerar eco.'}${detail}`.trim());
      }

      if (!isNarrativeEchoResponse(data)) {
        throw new Error('A resposta do endpoint de IA veio em formato inesperado.');
      }

      setEcho(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao gerar o eco narrativo.';
      setEchoError(message);
    } finally {
      setEchoLoading(false);
    }
  }

  const toneAccent =
    echo?.tone === 'oppressive'
      ? 'text-red-300'
      : echo?.tone === 'hopeful'
        ? 'text-blue-300'
        : 'text-amber-200';

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        {rainColumns.map((drop, index) => (
          <div
            key={index}
            className="absolute w-px bg-blue-400/30 animate-pulse"
            style={{
              left: drop.left,
              top: 0,
              height: drop.height,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 max-w-xl w-full mx-8 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      >
        <div className="text-gray-600/60 text-[10px] tracking-[0.5em] mb-8">
          FIM DA DEMO - CORRENTES: FRAGMENTOS DE VONTADE
        </div>

        <div
          className={`text-2xl tracking-[0.2em] mb-6 ${ending.endingColor}`}
          style={{
            fontFamily: 'Georgia, serif',
            textShadow: '0 0 30px currentColor',
            opacity: showStats ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        >
          {ending.title}
        </div>

        <div
          className="text-gray-400 italic text-sm mb-6 leading-relaxed"
          style={{
            fontFamily: 'Georgia, serif',
            opacity: showStats ? 1 : 0,
            transition: 'opacity 0.8s ease 0.2s',
          }}
        >
          {ending.aikoLine}
        </div>

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
          "{ending.text}"
        </div>

        <div
          className="border border-gray-800/60 p-6 mb-6 text-left space-y-3"
          style={{
            background: 'rgba(8,10,20,0.8)',
            opacity: showStats ? 1 : 0,
            transition: 'opacity 0.8s ease 0.6s',
          }}
        >
          <div className="text-[10px] text-gray-600 tracking-widest mb-4">ESTADO DE AIKO</div>

          <StatLine label="Confianca" value={result.trust} max={100} color="#22c55e" />
          <StatLine
            label="Dependencia"
            value={result.dependency}
            max={100}
            color={result.dependency > 50 ? '#ef4444' : '#f97316'}
          />
          <StatLine label="Autonomia" value={result.autonomy} max={100} color="#3b82f6" />

          <div className="pt-3 border-t border-gray-800/40">
            <div className="text-[10px] text-gray-600 tracking-widest mb-2">ESCOLHAS</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                Vinculo inicial:{' '}
                <span className={result.chosenPath === 'trust' ? 'text-blue-400' : 'text-red-400'}>
                  {result.chosenPath === 'trust' ? '"Entao caminha comigo."' : '"Voce precisa de mim."'}
                </span>
              </div>
              <div>
                Correntes forcadas:{' '}
                <span
                  className={
                    result.forcedChainCount >= 3
                      ? 'text-red-400'
                      : result.forcedChainCount > 0
                        ? 'text-orange-400'
                        : 'text-blue-400'
                  }
                >
                  {result.forcedChainCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mb-8"
          style={{
            opacity: showEnd ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        >
          <button
            onClick={handleGenerateEcho}
            disabled={echoLoading}
            className="border border-gray-700/60 text-gray-300 px-6 py-3 text-sm tracking-[0.25em] hover:border-blue-700/60 hover:text-blue-300 transition-all duration-300 disabled:opacity-60 disabled:cursor-wait"
            style={{
              background: 'rgba(8,10,20,0.72)',
            }}
          >
            {echoLoading ? 'OUVINDO O ECO...' : echo ? 'REGERAR ECO COM IA' : 'INVOCAR ECO COM IA'}
          </button>

          <div className="text-[10px] text-gray-600 tracking-widest mt-3">VERCEL AI GATEWAY - /api/ai</div>

          {echoError && (
            <div className="mt-4 border border-red-900/40 bg-red-950/20 px-4 py-3 text-left text-xs text-red-200/85 leading-relaxed">
              {echoError}
            </div>
          )}

          {echo && (
            <div
              className="mt-5 border border-gray-800/60 p-5 text-left"
              style={{
                background: 'rgba(8,10,20,0.82)',
                boxShadow: '0 0 26px rgba(59,130,246,0.08)',
              }}
            >
              <div className="text-[10px] text-gray-600 tracking-widest mb-3">ECO DO VINCULO</div>
              <div
                className={`text-lg mb-3 ${toneAccent}`}
                style={{
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 0 18px currentColor',
                }}
              >
                {echo.title}
              </div>
              <div className="text-sm text-gray-300 italic mb-3 leading-relaxed">"{echo.aikoAfterline}"</div>
              <div className="text-sm text-yellow-100/75 leading-relaxed mb-4">{echo.reflection}</div>
              <div className="text-[10px] text-gray-600 tracking-widest">{formatToneLabel(echo.tone)} - {echo.model}</div>
            </div>
          )}
        </div>

        <div
          className="text-gray-500/80 text-sm italic mb-10"
          style={{
            fontFamily: 'Georgia, serif',
            opacity: showEnd ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        >
          "Vinculos nao sao feitos para prender. Sao feitos para continuar."
        </div>

        <button
          onClick={onRestart}
          className="border border-gray-700/60 text-gray-400 px-8 py-3 text-sm tracking-[0.3em] hover:border-blue-700/60 hover:text-blue-300 transition-all duration-300"
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

function getEndingPresentation(result: GameResult): EndingPresentation {
  const isDark = result.dependency > 45 || result.forcedChainCount >= 3;
  const chosenForced = result.chosenPath === 'dependency';

  if (isDark && chosenForced) {
    return {
      title: 'Corrente Viva',
      text: 'Ela estava viva. Mas algo nela ja nao era completamente dela.',
      aikoLine:
        '"Quando voce puxa essa corrente... eu sinto como se uma parte minha ficasse com voce."',
      endingColor: 'text-red-300',
    };
  }

  if (isDark && !chosenForced) {
    return {
      title: 'Fragmento Preso',
      text: 'Ela estava segura. Mas algo nela ficou preso.',
      aikoLine: '"Nao me deixa para tras..."',
      endingColor: 'text-orange-300',
    };
  }

  return {
    title: 'Passo Proprio',
    text: 'Ele ainda nao sabia proteger sem prender. Mas, por um instante, tentou.',
    aikoLine: '"Eu ainda estou com medo... mas consigo andar."',
    endingColor: 'text-blue-300',
  };
}

function isNarrativeEchoResponse(value: unknown): value is NarrativeEchoResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const echo = value as Record<string, unknown>;
  return (
    typeof echo.title === 'string' &&
    typeof echo.aikoAfterline === 'string' &&
    typeof echo.reflection === 'string' &&
    (echo.tone === 'hopeful' || echo.tone === 'fragile' || echo.tone === 'oppressive') &&
    typeof echo.model === 'string' &&
    typeof echo.generatedAt === 'string'
  );
}

function formatToneLabel(tone: NarrativeEchoResponse['tone']) {
  switch (tone) {
    case 'oppressive':
      return 'TOM OPRESSIVO';
    case 'hopeful':
      return 'TOM ESPERANCO';
    default:
      return 'TOM FRAGIL';
  }
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
