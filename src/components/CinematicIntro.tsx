import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

interface CinematicIntroProps {
  isHeroReady: boolean;
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ isHeroReady, onComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);
  const glintRef = useRef<HTMLDivElement | null>(null);
  const sparklesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const centerGlowRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [isDone, setIsDone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !!sessionStorage.getItem('icon_mun_intro_seen');
  });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Skip Intro Handler
  const handleSkip = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    sessionStorage.setItem('icon_mun_intro_seen', 'true');
    setIsDone(true);
    document.body.style.overflow = '';
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  }, []);

  useEffect(() => {
    if (isDone) {
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      handleSkip();
      return;
    }

    // Lock scroll during intro
    document.body.style.overflow = 'hidden';

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
      });
      timelineRef.current = tl;

      // 1. Black screen: Faint gold glow pulses in center
      tl.fromTo(
        centerGlowRef.current,
        { opacity: 0, scale: 0.7 },
        { opacity: 0.6, scale: 1.1, duration: 1.0, yoyo: true, repeat: 1, ease: 'sine.inOut' }
      );

      // Loading progress line simulates buffer
      if (progressBarRef.current) {
        tl.to(progressBarRef.current, { scaleX: 1, duration: 1.4, ease: 'power1.inOut' }, 0);
      }

      // 2. Logo fades in from black and scales 0.85 to 1
      tl.fromTo(
        logoWrapperRef.current,
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1.0, duration: 1.1, ease: 'power3.out' },
        0.8
      );

      // 3. Diagonal gold light glint sweeps across the logo once
      if (glintRef.current) {
        tl.fromTo(
          glintRef.current,
          { xPercent: -120, opacity: 0 },
          { xPercent: 140, opacity: 0.85, duration: 0.8, ease: 'power2.inOut' },
          1.7
        );
      }

      // 4. 30 gold sparkles burst outward from the mask's jewels and fade
      tl.add(() => {
        const canvas = sparklesCanvasRef.current;
        if (!canvas) return;
        const cCtx = canvas.getContext('2d');
        if (!cCtx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const sparkles = Array.from({ length: 30 }).map(() => {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2.5;
          return {
            x: cx + (Math.random() - 0.5) * 40,
            y: cy - 10 + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2.5 + 1.2,
            alpha: 1,
            color: Math.random() > 0.4 ? '#FFF3D6' : '#D4AF6A',
          };
        });

        let frame = 0;
        const animateSparkles = () => {
          cCtx.clearRect(0, 0, canvas.width, canvas.height);
          sparkles.forEach((s) => {
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.94;
            s.vy *= 0.94;
            s.alpha -= 0.022;

            if (s.alpha > 0) {
              cCtx.save();
              cCtx.globalAlpha = Math.max(0, s.alpha);
              cCtx.fillStyle = s.color;
              cCtx.shadowColor = s.color;
              cCtx.shadowBlur = 8;
              cCtx.beginPath();
              cCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
              cCtx.fill();
              cCtx.restore();
            }
          });
          frame++;
          if (frame < 50) {
            requestAnimationFrame(animateSparkles);
          }
        };
        requestAnimationFrame(animateSparkles);
      }, 2.3);

      // 5. Logo holds for a beat, then scales up toward camera while fading to black
      tl.to(
        logoWrapperRef.current,
        {
          scale: 2.2,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.in',
          delay: 0.5,
        },
        2.8
      );

      // Container fades away to reveal hero
      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => {
            sessionStorage.setItem('icon_mun_intro_seen', 'true');
            setIsDone(true);
            document.body.style.overflow = '';
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
          },
        },
        3.5
      );
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = '';
    };
  }, [isDone, isHeroReady, handleSkip]);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-[#050505] overflow-hidden select-none"
    >
      {/* 1. Center Gold Ambient Glow */}
      <div
        ref={centerGlowRef}
        className="pointer-events-none absolute h-[400px] w-[400px] rounded-full opacity-0 will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,106,0.3) 0%, rgba(90,15,30,0.2) 45%, transparent 70%)',
        }}
      />

      {/* Sparkles Canvas */}
      <canvas
        ref={sparklesCanvasRef}
        className="pointer-events-none absolute inset-0 z-20"
      />

      {/* 2. Logo Presentation Wrapper */}
      <div
        ref={logoWrapperRef}
        className="relative z-10 flex flex-col items-center justify-center p-4 max-w-sm sm:max-w-md w-full opacity-0 will-change-transform"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-[#D4AF6A]/20">
          <img
            src="/assets/logo.png"
            alt="ICON MUN Official Emblem"
            className="w-full h-auto object-contain block"
          />

          {/* 3. Diagonal Gold Glint Sweep Overlay */}
          <div
            ref={glintRef}
            className="pointer-events-none absolute inset-0 -skew-x-12 will-change-transform opacity-0"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,243,214,0.45) 50%, transparent 100%)',
              width: '50%',
            }}
          />
        </div>

        <p className="mt-4 font-cinzel text-xs uppercase tracking-[0.35em] text-[#D4AF6A] drop-shadow-md">
          The Masquerade Begins
        </p>
      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-8 z-30 rounded-full border border-[#D4AF6A]/30 bg-[#0A0A0A]/70 px-4 py-1.5 text-[11px] uppercase font-mono tracking-widest text-[#F3DFA2] backdrop-blur-md transition-all hover:border-[#D4AF6A] hover:bg-[#141414] cursor-pointer"
      >
        Skip Intro →
      </button>

      {/* Thin Gold Loading Progress Line at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 z-30">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-[#8C6221] via-[#D4AF6A] to-[#FFF3D6] origin-left will-change-transform"
          style={{ transform: 'scaleX(0.15)' }}
        />
      </div>
    </div>
  );
};
