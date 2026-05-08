import type { DialogueVisualTone } from './DialogueUIAnimator';

interface Props {
  speaker: string;
  tone: DialogueVisualTone;
  speaking: boolean;
}

interface PortraitPalette {
  frame: string;
  bgTop: string;
  bgBottom: string;
  aura: string;
  skin: string;
  hair: string;
  coat: string;
  accent: string;
  eye: string;
}

function getPalette(speaker: string, tone: DialogueVisualTone): PortraitPalette {
  if (speaker === 'Aiko') {
    return {
      frame: '#f3b6ca',
      bgTop: '#24101a',
      bgBottom: '#130b12',
      aura: '#ff8eb8',
      skin: '#ecd7cc',
      hair: '#5a443f',
      coat: '#cbc0b8',
      accent: '#f6d1de',
      eye: '#fff7fb',
    };
  }

  if (speaker === 'Ren') {
    return {
      frame: '#7fc0ff',
      bgTop: '#101727',
      bgBottom: '#0a101a',
      aura: '#5caeff',
      skin: '#d8c4b2',
      hair: '#1a2236',
      coat: '#1f283d',
      accent: '#87bfff',
      eye: '#edf8ff',
    };
  }

  if (speaker === 'Lia') {
    return {
      frame: '#f2c28f',
      bgTop: '#2a1612',
      bgBottom: '#150d0c',
      aura: '#ffd29c',
      skin: '#ecd6c7',
      hair: '#59413a',
      coat: '#c98d70',
      accent: '#ffe1bf',
      eye: '#fff8f0',
    };
  }

  if (tone === 'system') {
    return {
      frame: '#91cbff',
      bgTop: '#121a26',
      bgBottom: '#0a1018',
      aura: '#7dd3ff',
      skin: '#c9d7e5',
      hair: '#1a2432',
      coat: '#223248',
      accent: '#bce7ff',
      eye: '#f2fbff',
    };
  }

  return {
    frame: '#d8c798',
    bgTop: '#18140d',
    bgBottom: '#0d0a07',
    aura: '#d8c798',
    skin: '#ccbca5',
    hair: '#2d261c',
    coat: '#453726',
    accent: '#f0e0b3',
    eye: '#fff7db',
  };
}

export function DialoguePortrait({ speaker, tone, speaking }: Props) {
  const palette = getPalette(speaker, tone);
  const isAiko = speaker === 'Aiko';
  const isRen = speaker === 'Ren';
  const isLia = speaker === 'Lia';
  const isNarration = !speaker && tone === 'narration';
  const isSystem = tone === 'system';

  return (
    <div
      className="relative w-[92px] h-[118px] border overflow-hidden shrink-0"
      style={{
        borderColor: `${palette.frame}55`,
        background: `linear-gradient(180deg, ${palette.bgTop} 0%, ${palette.bgBottom} 100%)`,
        boxShadow: speaking
          ? `0 0 22px ${palette.aura}22, inset 0 0 24px ${palette.aura}14`
          : `0 0 18px rgba(0,0,0,0.22), inset 0 0 18px ${palette.aura}0f`,
        transform: speaking ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 120ms ease, box-shadow 180ms ease',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${palette.frame} 50%, transparent 100%)` }}
      />

      <svg viewBox="0 0 92 118" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id={`portrait-aura-${speaker || tone}`} cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor={palette.aura} stopOpacity={speaking ? 0.24 : 0.16} />
            <stop offset="100%" stopColor={palette.aura} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="92" height="118" fill={`url(#portrait-aura-${speaker || tone})`} />

        {isNarration || isSystem ? (
          <>
            <path
              d="M18 82 C26 58, 40 40, 46 34 C54 40, 68 58, 74 82"
              fill={palette.coat}
              opacity="0.94"
            />
            <ellipse cx="46" cy="48" rx="14" ry="18" fill={palette.skin} opacity="0.92" />
            <path
              d="M30 49 C36 34, 54 30, 62 47 C58 39, 46 36, 34 44 Z"
              fill={palette.hair}
              opacity="0.96"
            />
            <path
              d="M21 61 C34 46, 58 46, 71 61 C58 74, 34 74, 21 61 Z"
              fill="none"
              stroke={palette.accent}
              strokeOpacity="0.66"
              strokeWidth="1.2"
            />
            <circle cx="46" cy="61" r="4" fill={palette.eye} />
          </>
        ) : (
          <>
            <path
                d={
                  isRen
                    ? 'M20 96 C22 76, 30 62, 46 58 C63 62, 70 76, 72 96 L60 100 L32 100 Z'
                    : isLia
                      ? 'M19 98 C22 82, 30 66, 46 60 C63 66, 69 82, 73 98 L57 102 L34 102 Z'
                      : 'M20 98 C23 80, 30 66, 46 61 C61 66, 68 80, 72 98 L58 102 L34 102 Z'
                }
                fill={palette.coat}
                opacity="0.96"
              />

              <path
                d={
                  isRen
                    ? 'M28 36 C34 24, 59 22, 64 42 C63 53, 58 60, 46 61 C34 60, 28 52, 28 36 Z'
                    : isLia
                      ? 'M30 37 C34 24, 57 24, 62 39 C62 52, 57 61, 46 62 C35 61, 30 52, 30 37 Z'
                      : 'M30 38 C34 26, 56 25, 61 40 C61 52, 56 60, 46 61 C35 60, 30 52, 30 38 Z'
                }
                fill={palette.skin}
              />

              <path
                d={
                  isRen
                    ? 'M25 38 C29 23, 41 18, 56 20 C63 22, 67 28, 66 40 C60 32, 53 30, 48 31 C44 30, 39 33, 33 39 C31 42, 29 45, 27 47 C24 45, 24 41, 25 38 Z'
                    : isLia
                      ? 'M28 40 C29 28, 39 21, 51 22 C59 23, 64 28, 64 39 C59 34, 54 34, 49 35 C45 34, 40 36, 37 39 C36 44, 36 49, 34 55 C30 51, 28 46, 28 40 Z'
                      : 'M28 40 C28 28, 39 21, 51 22 C60 23, 65 29, 64 39 C59 34, 54 33, 50 34 C47 34, 43 35, 38 39 C37 43, 36 48, 34 52 C30 49, 28 45, 28 40 Z'
                }
                fill={palette.hair}
                opacity="0.98"
              />

            {(isAiko || isLia) && (
              <path
                d={isLia
                  ? 'M32 45 C31 50, 30 56, 29 61 C35 60, 39 56, 40 50 Z M52 44 C56 49, 58 54, 59 60 C54 58, 50 54, 49 49 Z'
                  : 'M33 44 C31 49, 30 55, 28 59 C35 58, 39 54, 40 50 Z M52 44 C56 48, 58 54, 60 60 C53 58, 50 53, 49 49 Z'}
                fill={palette.hair}
                opacity="0.88"
              />
            )}

            <ellipse cx="40" cy="45" rx="1.1" ry="1.6" fill={palette.eye} />
            <ellipse cx="50" cy="45" rx="1.1" ry="1.6" fill={palette.eye} />
            <path
              d={
                isRen
                  ? 'M40 53 C43 55, 48 55, 51 53'
                  : isLia
                    ? 'M39 53 C42 57, 48 57, 52 53'
                    : 'M39 53 C42 56, 47 56, 51 53'
              }
              fill="none"
              stroke={palette.accent}
              strokeOpacity="0.7"
              strokeWidth="1"
              strokeLinecap="round"
            />

            <path
              d={
                isRen
                  ? 'M24 78 C33 70, 60 70, 68 78 L64 96 L28 96 Z'
                  : isLia
                    ? 'M23 80 C34 73, 58 72, 69 79 L64 97 L28 97 Z'
                    : 'M24 79 C34 72, 58 72, 68 79 L63 96 L29 96 Z'
              }
              fill={palette.accent}
              opacity={isAiko ? 0.14 : isLia ? 0.18 : 0.12}
            />
          </>
        )}

        <rect x="8" y="9" width="18" height="6" rx="1" fill={palette.frame} fillOpacity="0.16" />
        <circle cx="14" cy="12" r="1.4" fill={palette.frame} fillOpacity="0.86" />
        <path d="M19 12 H23" stroke={palette.frame} strokeOpacity="0.72" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
