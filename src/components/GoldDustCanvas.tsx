import React, { useEffect, useRef } from 'react';

interface GoldDustCanvasProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  baseVx: number;
  baseVy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
}

const GOLD_PALETTE = ['#FFF3D6', '#F3DFA2', '#D4AF6A', '#E8C882', '#B8893C'];

export const GoldDustCanvas: React.FC<GoldDustCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isPaused = document.hidden;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let currentVelocity = 0;

    // Strict constraint: 40 particles on desktop, 15 on mobile
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 15 : 40;

    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = Math.random() * 0.45 + 0.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseVx: (Math.random() - 0.5) * 0.35,
        baseVy: -(Math.random() * 0.4 + 0.15),
        size: Math.random() * 1.6 + 0.8,
        alpha: baseAlpha,
        baseAlpha,
        color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused) {
        lastTime = performance.now();
        lastScrollY = window.scrollY;
        animId = requestAnimationFrame(render);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = (timestamp: number) => {
      if (isPaused) return;

      ctx.clearRect(0, 0, width, height);

      // Instantaneous scroll velocity with damping
      const dt = Math.max(timestamp - lastTime, 16);
      const dy = window.scrollY - lastScrollY;
      const targetVelocity = (dy / dt) * 16;
      currentVelocity += (targetVelocity - currentVelocity) * 0.25;
      lastScrollY = window.scrollY;
      lastTime = timestamp;

      const absV = Math.abs(currentVelocity);
      const isSwirling = absV > 4.0;
      const swirlFactor = isSwirling ? Math.min((absV - 4.0) * 0.1, 2.5) : 0;
      const verticalBoost = Math.min(Math.max(currentVelocity * 0.06, -4), 4);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.pulsePhase += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.15;

        let vx = p.baseVx;
        let vy = p.baseVy - verticalBoost;

        if (swirlFactor > 0) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const angle = Math.atan2(dy, dx);
          const rotDir = currentVelocity > 0 ? 1 : -1;
          const tangentialX = -Math.sin(angle) * swirlFactor * (1 - Math.min(dist / (width * 0.8), 0.7)) * rotDir;
          const tangentialY = Math.cos(angle) * swirlFactor * (1 - Math.min(dist / (width * 0.8), 0.7)) * rotDir;

          vx += tangentialX;
          vy += tangentialY;
        }

        p.x += vx;
        p.y += vy;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        } else if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.globalAlpha = Math.max(0.1, Math.min(p.alpha, 0.9));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-[2] ${className}`}
      aria-hidden="true"
    />
  );
};
