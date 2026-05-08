import { useState, useEffect, useRef } from 'react';

interface Props {
  onStart: () => void;
}

export function MainMenu({ onStart }: Props) {
  const [chainAnim, setChainAnim] = useState(0);
  const [show, setShow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  // Background particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Rain particles
    const rain: { x: number; y: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 150; i++) {
      rain.push({ x: Math.random() * W, y: Math.random() * H, vx: 0.6, vy: 8 + Math.random() * 4 });
    }

    // Chain nodes for ambient animation
    const chains: { x: number; y: number; angle: number; speed: number; color: string }[] = [
      { x: W * 0.15, y: H * 0.4, angle: 0, speed: 0.008, color: '#1144aa' },
      { x: W * 0.8, y: H * 0.35, angle: 1.2, speed: 0.006, color: '#220055' },
      { x: W * 0.5, y: H * 0.6, angle: 2.4, speed: 0.01, color: '#004488' },
    ];

    let frame = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(4,5,12,0.92)';
      ctx.fillRect(0, 0, W, H);

      // Rain
      ctx.lineWidth = 0.8;
      for (const r of rain) {
        r.x += r.vx; r.y += r.vy;
        if (r.y > H || r.x < 0) { r.x = Math.random() * W; r.y = -10; }
        const alpha = 0.1 + (r.y / H) * 0.12;
        ctx.strokeStyle = `rgba(80,120,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.vx * 3, r.y + r.vy * 3);
        ctx.stroke();
      }

      // Ambient chain effects
      for (const c of chains) {
        c.angle += c.speed;
        const len = 120 + Math.sin(c.angle * 3) * 40;
        const tx = c.x + Math.cos(c.angle) * len;
        const ty = c.y + Math.sin(c.angle) * len;
        ctx.save();
        ctx.strokeStyle = c.color + '88';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 12;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        // Node
        ctx.fillStyle = c.color + 'aa';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      frame++;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setChainAnim(a => a + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const chainDots = Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className="inline-block w-1.5 h-1.5 rounded-full mx-1 transition-all duration-300"
      style={{
        background: `rgba(${40 + i * 20}, ${80 + i * 30}, ${180 + i * 15}, ${0.4 + 0.5 * Math.sin((chainAnim + i) * 0.8)})`,
        boxShadow: `0 0 6px rgba(60,100,255,${0.3 + 0.4 * Math.sin((chainAnim + i) * 0.8)})`,
        transform: `scale(${0.7 + 0.5 * Math.sin((chainAnim + i) * 0.8)})`,
      }}
    />
  ));

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="absolute inset-0 w-full h-full"
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-8"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Chain decoration */}
        <div className="flex items-center mb-8">{chainDots}</div>

        {/* Title */}
        <h1
          className="text-5xl tracking-[0.12em] text-white mb-2"
          style={{
            fontFamily: 'Georgia, serif',
            textShadow: '0 0 40px rgba(60,100,255,0.5), 0 0 80px rgba(60,100,255,0.2)',
            letterSpacing: '0.15em',
          }}
        >
          CORRENTES
        </h1>
        <div
          className="text-sm tracking-[0.5em] text-blue-300/60 mb-10"
          style={{ letterSpacing: '0.5em' }}
        >
          FRAGMENTOS DE VONTADE
        </div>

        {/* Chain decoration bottom */}
        <div className="flex items-center mb-12">{chainDots}</div>

        {/* Subtitle / premise */}
        <p
          className="text-gray-400/80 text-sm max-w-xs leading-relaxed italic mb-12"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          "Quanto mais forte o vínculo, maior o poder — mas maior também o peso de usá-lo."
        </p>

        {/* Start button */}
        <button
          onClick={onStart}
          className="group relative px-10 py-4 border border-blue-700/60 text-blue-200 tracking-[0.3em] text-sm
            hover:border-blue-400/80 hover:text-blue-100 transition-all duration-300 uppercase"
          style={{
            background: 'rgba(10,20,60,0.4)',
            boxShadow: '0 0 20px rgba(50,80,255,0.15), inset 0 0 20px rgba(50,80,255,0.05)',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.boxShadow = '0 0 30px rgba(50,80,255,0.4), inset 0 0 30px rgba(50,80,255,0.1)';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.boxShadow = '0 0 20px rgba(50,80,255,0.15), inset 0 0 20px rgba(50,80,255,0.05)';
          }}
        >
          Iniciar Demo
        </button>

        {/* Controls hint */}
        <div className="mt-8 text-gray-700 text-[10px] tracking-widest space-y-1">
          <div>WASD — Mover · J — Ataque · K — Pesado · ESPAÇO — Esquiva</div>
          <div className="text-blue-800">Q — Fio de Vínculo · E — Corrente Forçada · F — Interagir</div>
        </div>

        {/* Bottom tagline */}
        <div
          className="mt-12 text-gray-600/60 text-xs tracking-widest"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Vínculos não são feitos para prender. São feitos para continuar.
        </div>
      </div>
    </div>
  );
}
