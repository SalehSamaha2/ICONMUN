import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface CinematicIntroProps {
  isHeroReady: boolean;
  onExiting?: () => void;
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onExiting,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftCurtainRef = useRef<HTMLDivElement | null>(null);
  const rightCurtainRef = useRef<HTMLDivElement | null>(null);
  const centerContentRef = useRef<HTMLDivElement | null>(null);
  const emblemRef = useRef<HTMLDivElement | null>(null);
  const orbitRef = useRef<HTMLDivElement | null>(null);
  const wordmarkRef = useRef<HTMLHeadingElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onExitingRef = useRef(onExiting);

  const [isDone, setIsDone] = useState<boolean>(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onExitingRef.current = onExiting;
  }, [onExiting]);

  // Compute exact navbar destination coordinates for smooth emblem flight hand-off
  const getNavDestination = useCallback(() => {
    if (typeof window === 'undefined') {
      return { targetX: -200, targetY: -200, targetScale: 0.32 };
    }
    const centerW = window.innerWidth / 2;
    const centerH = window.innerHeight / 2;
    const navTarget = document.getElementById('nav-brand-logo');

    if (navTarget) {
      const rect = navTarget.getBoundingClientRect();
      const targetCenterX = rect.left + rect.width / 2;
      const targetCenterY = rect.top + rect.height / 2;
      return {
        targetX: targetCenterX - centerW,
        targetY: targetCenterY - centerH,
        targetScale: Math.max(rect.width / 140, 0.28),
      };
    }

    return {
      targetX: -centerW + 68,
      targetY: -centerH + 36,
      targetScale: 0.32,
    };
  }, []);

  // Gracefully part curtains, fly emblem into navbar, and unveil the site
  const finishIntro = useCallback(() => {
    timelineRef.current?.kill();
    const container = containerRef.current;
    if (!container) {
      setIsDone(true);
      document.body.style.overflow = '';
      onCompleteRef.current();
      return;
    }

    // Notify parent that curtains are parting so hero scale-down begins simultaneously
    if (onExitingRef.current) {
      onExitingRef.current();
    }

    const { targetX, targetY, targetScale } = getNavDestination();

    const tl = gsap.timeline({
      onComplete: () => {
        setIsDone(true);
        document.body.style.overflow = '';
        onCompleteRef.current();
      },
    });

    // 1. Text typography fades upward
    tl.to(
      [
        wordmarkRef.current,
        taglineRef.current,
        eyebrowRef.current,
        lineRef.current,
        progressRef.current,
      ],
      {
        opacity: 0,
        y: -18,
        duration: 0.3,
        ease: 'power2.in',
      },
      0
    )
      // 2. Curtains part symmetrically
      .to(
        leftCurtainRef.current,
        {
          xPercent: -101,
          duration: 0.85,
          ease: 'power4.inOut',
        },
        0.05
      )
      .to(
        rightCurtainRef.current,
        {
          xPercent: 101,
          duration: 0.85,
          ease: 'power4.inOut',
        },
        0.05
      )
      // 3. Celestial orbit dissolves
      .to(
        orbitRef.current,
        {
          scale: 1.25,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
        },
        0.05
      )
      // 4. Logo Flight Hand-off: Emblem glides directly into the top-left navbar
      .to(
        emblemRef.current,
        {
          x: targetX,
          y: targetY,
          scale: targetScale,
          duration: 0.82,
          ease: 'power3.inOut',
        },
        0.05
      )
      .to(
        emblemRef.current,
        {
          opacity: 0,
          duration: 0.12,
          ease: 'power1.out',
        },
        0.75
      )
      // 5. Container dissolves cleanly
      .to(
        container,
        {
          opacity: 0,
          duration: 0.25,
          ease: 'power1.out',
        },
        0.7
      );
  }, [getNavDestination]);

  useEffect(() => {
    if (isDone) {
      onCompleteRef.current();
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setIsDone(true);
      onCompleteRef.current();
      return;
    }

    document.body.style.overflow = 'hidden';

    // Set initial states
    gsap.set(containerRef.current, { opacity: 1 });
    gsap.set([leftCurtainRef.current, rightCurtainRef.current], { xPercent: 0 });
    gsap.set(centerContentRef.current, { opacity: 1 });
    gsap.set(emblemRef.current, {
      opacity: 0,
      scale: 0.65,
      x: 0,
      y: 20,
      rotation: -10,
      filter: 'drop-shadow(0 0 0px rgba(198,166,106,0))',
    });
    gsap.set(orbitRef.current, { opacity: 0, scale: 0.5, rotation: -70 });
    gsap.set(wordmarkRef.current, { opacity: 0, y: 20, letterSpacing: '0.4em' });
    gsap.set([taglineRef.current, eyebrowRef.current], { opacity: 0, y: 12 });
    gsap.set(lineRef.current, { scaleX: 0, transformOrigin: 'center' });
    gsap.set(progressRef.current, { scaleX: 0, transformOrigin: 'left' });

    // Build intro timeline
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: finishIntro,
    });
    timelineRef.current = timeline;

    timeline
      // Step 1: Gold hairline expands & orbit appears
      .to(lineRef.current, { scaleX: 1, duration: 0.3, ease: 'power4.out' }, 0.05)
      .to(orbitRef.current, { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'power4.out' }, 0.08)
      // Step 2: Gilded Masquerade Emblem reveals with bounce and gold glow
      .to(
        emblemRef.current,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotation: 0,
          duration: 0.6,
          ease: 'back.out(1.6)',
          filter: 'drop-shadow(0 0 35px rgba(231,219,195,0.45))',
        },
        0.12
      )
      // Step 3: Celestial orbit continuous rotation
      .to(orbitRef.current, { rotation: 360, duration: 2.2, ease: 'none' }, 0.15)
      // Step 4: Wordmark & Typography
      .to(wordmarkRef.current, { opacity: 1, y: 0, letterSpacing: '0.22em', duration: 0.45, ease: 'power4.out' }, 0.28)
      .to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.3 }, 0.35)
      .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.32 }, 0.42)
      // Step 5: Timeline Progress Bar
      .to(progressRef.current, { scaleX: 1, duration: 1.4, ease: 'power1.inOut' }, 0.45)
      // Step 6: Brief hold to appreciate branding
      .to({}, { duration: 0.35 });

    return () => {
      timeline.kill();
      document.body.style.overflow = '';
    };
  }, [isDone, finishIntro]);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      data-theme="dark"
      role="presentation"
      className="fixed inset-0 z-[100] overflow-hidden select-none"
      style={{ background: '#090908', color: '#e7dbc3' }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(181,145,83,0.14), transparent 45%), linear-gradient(145deg, #090908 0%, #12110e 52%, #080807 100%)',
        }}
      />

      {/* Symmetrical Grand Curtains */}
      <div
        ref={leftCurtainRef}
        className="absolute inset-y-0 left-0 z-[1] w-1/2 will-change-transform"
        style={{
          background: 'linear-gradient(120deg, #090908 0%, #12110e 100%)',
          borderRight: '1px solid rgba(231,219,195,0.18)',
          boxShadow: '10px 0 50px rgba(0,0,0,0.85)',
        }}
      />
      <div
        ref={rightCurtainRef}
        className="absolute inset-y-0 right-0 z-[1] w-1/2 will-change-transform"
        style={{
          background: 'linear-gradient(240deg, #090908 0%, #12110e 100%)',
          borderLeft: '1px solid rgba(231,219,195,0.18)',
          boxShadow: '-10px 0 50px rgba(0,0,0,0.85)',
        }}
      />

      {/* Center Branding Stage */}
      <div
        ref={centerContentRef}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
      >
        <p
          ref={eyebrowRef}
          className="mb-6 text-[9px] sm:text-[10px] uppercase tracking-[0.42em] text-[#b8a47e]"
        >
          The International Masquerade of Diplomacy
        </p>

        {/* Crest & Celestial Orbit */}
        <div className="relative mb-6 flex h-40 w-40 sm:h-48 sm:w-48 items-center justify-center">
          <div
            ref={orbitRef}
            className="absolute inset-0 rounded-full will-change-transform"
            style={{
              border: '1px solid rgba(231,219,195,0.48)',
              boxShadow: '0 0 40px rgba(185,147,83,0.12)',
            }}
          >
            <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#e7dbc3] shadow-[0_0_8px_#e7dbc3]" />
            <span className="absolute bottom-[12%] right-[4%] h-1 w-1 rounded-full bg-[#a88952]" />
          </div>
          <div
            className="absolute inset-[9px] rounded-full"
            style={{ border: '1px solid rgba(231,219,195,0.14)' }}
          />
          <div
            ref={emblemRef}
            className="relative flex h-[130px] w-[130px] sm:h-[155px] sm:w-[155px] items-center justify-center will-change-transform"
          >
            <img
              src="https://d2ol7oe51mr4n9.cloudfront.net/user_3L3BcEGyaQpmkmEhNe5xVxLe3my/9798219d-d695-44ba-ac50-1a0b70e05a70.jpg"
              alt="Official ICON MUN masquerade emblem"
              className="h-full w-full rounded-full border border-[#c6a66a]/70 object-cover shadow-[0_0_30px_rgba(231,219,195,0.25)]"
            />
          </div>
        </div>

        {/* Separator Hairline */}
        <div
          ref={lineRef}
          className="mb-5 h-px w-28 sm:w-36 will-change-transform"
          style={{ background: 'linear-gradient(90deg, transparent, #c6a66a, transparent)' }}
        />

        {/* Wordmark */}
        <h1
          ref={wordmarkRef}
          className="font-cinzel text-3xl font-semibold uppercase sm:text-5xl tracking-[0.22em]"
          style={{ color: '#f0e5ce', textShadow: '0 0 35px rgba(198,166,106,0.22)' }}
        >
          ICON MUN
        </h1>

        <p
          ref={taglineRef}
          className="mt-4 max-w-md text-[10px] uppercase tracking-[0.26em] text-[#b8b0a0] sm:text-xs sm:tracking-[0.32em]"
        >
          Behind the Masquerade of Global Diplomacy
        </p>

        <p className="mt-6 font-mono text-[9px] tracking-[0.38em] text-[#8f805f]">
          RIYADH · 2027
        </p>
      </div>

      {/* Bottom Sequence Progress Line */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 h-[2px]"
        style={{ background: 'rgba(231,219,195,0.1)' }}
      >
        <div
          ref={progressRef}
          className="h-full will-change-transform"
          style={{
            background: 'linear-gradient(90deg, #8d6c36, #e7dbc3, #8d6c36)',
            transform: 'scaleX(0)',
          }}
        />
      </div>

      {/* Accessible Skip Button */}
      <button
        type="button"
        onClick={finishIntro}
        aria-label="Skip intro animation"
        className="absolute right-5 top-5 z-30 rounded-full border px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] transition-all duration-200 hover:bg-[#e7dbc3]/15 hover:border-[#e7dbc3] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7dbc3]"
        style={{
          borderColor: 'rgba(231,219,195,0.35)',
          color: '#e7dbc3',
          background: 'rgba(9,9,8,0.65)',
          backdropFilter: 'blur(8px)',
        }}
      >
        Skip <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
};
