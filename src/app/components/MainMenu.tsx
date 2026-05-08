import { useState, useEffect, useRef } from 'react';
import { playDialogueAdvanceSound, primeDialogueAudio } from './game/DialogueAudio';

interface Props {
  onStart: () => void;
}

export function MainMenu({ onStart }: Props) {
  const [chainAnim, setChainAnim] = useState(0);
  const [show, setShow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const rain: { x: number; y: number; vx: number; vy: number; len: number }[] = [];
    const skyline = Array.from({ length: 10 }, (_, index) => ({
      x: index * 96,
      w: 70 + (index % 3) * 16,
      h: 80 + (index % 4) * 24,
    }));
    const chains = [
      { x: width * 0.14, y: height * 0.34, angle: 0, speed: 0.008, color: '#2c72ff' },
      { x: width * 0.81, y: height * 0.29, angle: 1.2, speed: 0.006, color: '#5f2dbe' },
      { x: width * 0.52, y: height * 0.68, angle: 2.4, speed: 0.01, color: '#2268ff' },
    ];

    for (let i = 0; i < 170; i++) {
      rain.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.6,
        vy: 8 + Math.random() * 4,
        len: 2.4 + Math.random() * 1.2,
      });
    }

    let frame = 0;
    const draw = () => {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#03040b');
      bg.addColorStop(0.45, '#050913');
      bg.addColorStop(1, '#020309');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#050811';
      for (const building of skyline) {
        ctx.fillRect(building.x, height * 0.2, building.w, building.h);
      }

      const fog = ctx.createRadialGradient(width * 0.5, height * 0.76, 20, width * 0.5, height * 0.76, 360);
      fog.addColorStop(0, 'rgba(40, 92, 160, 0.05)');
      fog.addColorStop(1, 'transparent');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 0.9;
      for (const drop of rain) {
        drop.x += drop.vx;
        drop.y += drop.vy;
        if (drop.y > height || drop.x < 0) {
          drop.x = Math.random() * width;
          drop.y = -10;
        }
        const alpha = 0.08 + (drop.y / height) * 0.18;
        ctx.strokeStyle = `rgba(102, 150, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.vx * drop.len, drop.y + drop.vy * drop.len);
        ctx.stroke();
      }

      for (const chain of chains) {
        chain.angle += chain.speed;
        const len = 132 + Math.sin(chain.angle * 3) * 34;
        const tx = chain.x + Math.cos(chain.angle) * len;
        const ty = chain.y + Math.sin(chain.angle) * len;

        ctx.save();
        ctx.strokeStyle = `${chain.color}88`;
        ctx.lineWidth = 1.7;
        ctx.shadowColor = chain.color;
        ctx.shadowBlur = 12;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(chain.x, chain.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `${chain.color}aa`;
        ctx.beginPath();
        ctx.arc(chain.x, chain.y, 4, 0, Math.PI * 2);
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = 'rgba(4, 7, 16, 0.54)';
      ctx.fillRect(0, height * 0.72, width, height * 0.28);
      ctx.strokeStyle = 'rgba(86, 146, 255, 0.06)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.73 + Math.sin(frame * 0.03) * 4);
      ctx.lineTo(width, height * 0.73 + Math.cos(frame * 0.03) * 4);
      ctx.stroke();

      frame++;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setChainAnim((value) => value + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const chainDots = Array.from({ length: 5 }, (_, index) => (
    <span
      key={index}
      className="inline-block w-1.5 h-1.5 mx-1 transition-all duration-300"
      style={{
        background: `rgba(${44 + index * 18}, ${96 + index * 18}, ${180 + index * 12}, ${0.35 + 0.45 * Math.sin((chainAnim + index) * 0.8)})`,
        boxShadow: `0 0 8px rgba(74, 126, 255, ${0.3 + 0.34 * Math.sin((chainAnim + index) * 0.8)})`,
        transform: `scale(${0.7 + 0.42 * Math.sin((chainAnim + index) * 0.8)})`,
      }}
    />
  ));

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="absolute inset-0 w-full h-full"
      />

      <div
        className="relative z-10 flex flex-col items-center text-center px-8"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="flex items-center mb-8">{chainDots}</div>

        <h1
          className="text-5xl text-white mb-2"
          style={{
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.14em',
            textShadow: '0 0 40px rgba(64, 120, 255, 0.5), 0 0 80px rgba(64, 120, 255, 0.18)',
          }}
        >
          CORRENTES
        </h1>
        <div className="text-sm text-blue-300/60 mb-10" style={{ letterSpacing: '0.48em' }}>
          FRAGMENTOS DE VONTADE
        </div>

        <div className="flex items-center mb-10">{chainDots}</div>

        <p
          className="text-gray-300/72 text-sm max-w-sm leading-relaxed italic mb-12"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          "Quanto mais forte o vinculo, maior o poder. E maior tambem o risco de confundir cuidado com controle."
        </p>

        <button
          onClick={() => {
            void primeDialogueAudio().then(() => playDialogueAdvanceSound());
            onStart();
          }}
          className="group relative px-10 py-4 border border-blue-700/60 text-blue-100 tracking-[0.3em] text-sm hover:border-blue-400/80 hover:text-white transition-all duration-300 uppercase"
          style={{
            background: 'rgba(10, 22, 56, 0.42)',
            boxShadow: '0 0 22px rgba(48, 92, 255, 0.16), inset 0 0 20px rgba(48, 92, 255, 0.06)',
          }}
          onMouseEnter={(event) => {
            (event.target as HTMLElement).style.boxShadow = '0 0 32px rgba(48, 92, 255, 0.34), inset 0 0 28px rgba(48, 92, 255, 0.1)';
          }}
          onMouseLeave={(event) => {
            (event.target as HTMLElement).style.boxShadow = '0 0 22px rgba(48, 92, 255, 0.16), inset 0 0 20px rgba(48, 92, 255, 0.06)';
          }}
        >
          Iniciar Demo
        </button>

        <div className="mt-8 text-gray-600 text-[10px] tracking-[0.22em] space-y-1">
          <div>Cena inicial: WASD mover  |  F observar</div>
          <div className="text-blue-400/70">Depois: J ataque  |  K pesado  |  Q fio  |  E corrente  |  Espaco esquiva</div>
        </div>

        <div
          className="mt-12 text-gray-500/70 text-xs"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', letterSpacing: '0.18em' }}
        >
          Vinculos nao sao feitos para prender. Sao feitos para continuar.
        </div>
      </div>
    </div>
  );
}
