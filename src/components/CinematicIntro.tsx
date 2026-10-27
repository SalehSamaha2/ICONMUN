import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface CinematicIntroProps {
  isHeroReady: boolean;
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftCurtainRef = useRef<HTMLDivElement | null>(null);
  const rightCurtainRef = useRef<HTMLDivElement | null>(null);
  const emblemRef = useRef<HTMLDivElement | null>(null);
  const orbitRef = useRef<HTMLDivElement | null>(null);
  const wordmarkRef = useRef<HTMLHeadingElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const onCompleteRef = useRef(onComplete);

  const [isDone, setIsDone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !!sessionStorage.getItem('icon_mun_intro_seen');
  });

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishIntro = useCallback(() => {
    timelineRef.current?.kill();
    const container = containerRef.current;
    if (!container) {
      sessionStorage.setItem('icon_mun_intro_seen', 'true');
      setIsDone(true);
      document.body.style.overflow = '';
      onCompleteRef.current();
      return;
    }

    gsap.to(container, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.inOut',
      onComplete: () => {
        sessionStorage.setItem('icon_mun_intro_seen', 'true');
        setIsDone(true);
        document.body.style.overflow = '';
        onCompleteRef.current();
      },
    });
  }, []);

  useEffect(() => {
    const replayIntro = () => {
      timelineRef.current?.kill();
      sessionStorage.removeItem('icon_mun_intro_seen');
      setIsDone(false);
    };
    window.addEventListener('icon-mun-replay-intro', replayIntro);
    return () => window.removeEventListener('icon-mun-replay-intro', replayIntro);
  }, []);

  useEffect(() => {
    if (isDone) {
      onCompleteRef.current();
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = 'connection' in navigator &&
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

    if (reducedMotion || saveData) {
      sessionStorage.setItem('icon_mun_intro_seen', 'true');
      setIsDone(true);
      onCompleteRef.current();
      return;
    }

    document.body.style.overflow = 'hidden';
    gsap.set(containerRef.current, { opacity: 1 });
    gsap.set([leftCurtainRef.current, rightCurtainRef.current], { xPercent: 0 });
    gsap.set(emblemRef.current, { opacity: 0, scale: 0.42, y: 22, rotation: -12, filter: 'drop-shadow(0 0 0px rgba(198,166,106,0))' });
    gsap.set(orbitRef.current, { opacity: 0, scale: 0.5, rotation: -70 });
    gsap.set(wordmarkRef.current, { opacity: 0, y: 22, letterSpacing: '0.42em' });
    gsap.set([taglineRef.current, eyebrowRef.current], { opacity: 0, y: 10 });
    gsap.set(lineRef.current, { scaleX: 0, transformOrigin: 'center' });
    gsap.set(progressRef.current, { scaleX: 0, transformOrigin: 'left' });

    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: finishIntro,
    });
    timelineRef.current = timeline;

    timeline
      .to(lineRef.current, { scaleX: 1, duration: 0.22, ease: 'power4.out' }, 0.02)
      .to(orbitRef.current, { opacity: 1, scale: 1, rotation: 0, duration: 0.42, ease: 'power4.out' }, 0.03)
      .to(emblemRef.current, { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 0.42, ease: 'back.out(1.8)', filter: 'drop-shadow(0 0 34px rgba(198,166,106,0.48))' }, 0.06)
      .to(orbitRef.current, { rotation: 360, duration: 1.15, ease: 'none' }, 0.08)
      .to(wordmarkRef.current, { opacity: 1, y: 0, letterSpacing: '0.22em', duration: 0.34, ease: 'power4.out' }, 0.18)
      .to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.22 }, 0.25)
      .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.24 }, 0.3)
      .to(progressRef.current, { scaleX: 1, duration: 0.48, ease: 'power2.inOut' }, 0.32)
      .to({}, { duration: 0.12 })
      .to([wordmarkRef.current, taglineRef.current, eyebrowRef.current, lineRef.current], {
        opacity: 0, y: -12, duration: 0.16, ease: 'power4.in', stagger: 0.01,
      })
      .to(emblemRef.current, {
        x: () => -window.innerWidth / 2 + 76,
        y: () => 40 - window.innerHeight * 0.34,
        scale: 0.29,
        rotation: 0,
        duration: 0.42,
        ease: 'power4.inOut',
      }, '<')
      .to(orbitRef.current, { scale: 1.18, opacity: 0, duration: 0.2, ease: 'power2.in' }, '<')
      .to(leftCurtainRef.current, { xPercent: -101, duration: 0.48, ease: 'power4.inOut' }, '<0.06')
      .to(rightCurtainRef.current, { xPercent: 101, duration: 0.9, ease: 'power4.inOut' }, '<')
      .to(emblemRef.current, { opacity: 0, duration: 0.08, ease: 'power1.out' }, '<0.38')
      .to(containerRef.current, { opacity: 0, duration: 0.12 }, '<0.4');

    return () => {
      timeline.kill();
      document.body.style.overflow = '';
    };
  }, [isDone, finishIntro]);

  if (isDone) return null;

  return (
    <div ref={containerRef} data-theme="dark" role="presentation" className="fixed inset-0 z-[100] overflow-hidden select-none" style={{ background: '#090908', color: '#e7dbc3' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 42%, rgba(181,145,83,0.12), transparent 43%), linear-gradient(145deg, #090908 0%, #12110e 52%, #080807 100%)' }} />
      <div ref={leftCurtainRef} className="absolute inset-y-0 left-0 z-[1] w-1/2" style={{ background: 'linear-gradient(120deg, #090908 0%, #12110e 100%)', borderRight: '1px solid rgba(231,219,195,0.13)' }} />
      <div ref={rightCurtainRef} className="absolute inset-y-0 right-0 z-[1] w-1/2" style={{ background: 'linear-gradient(240deg, #090908 0%, #12110e 100%)', borderLeft: '1px solid rgba(231,219,195,0.13)' }} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <p ref={eyebrowRef} className="mb-7 text-[9px] sm:text-[10px] uppercase tracking-[0.42em] text-[#b8a47e]">The International Masquerade of Diplomacy</p>

        <div className="relative mb-7 flex h-40 w-40 sm:h-48 sm:w-48 items-center justify-center">
          <div ref={orbitRef} className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(231,219,195,0.52)', boxShadow: '0 0 45px rgba(185,147,83,0.08)' }}>
            <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#e7dbc3]" />
            <span className="absolute bottom-[10%] right-[2%] h-1 w-1 rounded-full bg-[#a88952]" />
          </div>
          <div className="absolute inset-[8px] rounded-full" style={{ border: '1px solid rgba(231,219,195,0.16)' }} />
          <div ref={emblemRef} className="relative flex h-[132px] w-[132px] sm:h-[160px] sm:w-[160px] items-center justify-center">
            <img src="https://d2ol7oe51mr4n9.cloudfront.net/user_3L3BcEGyaQpmkmEhNe5xVxLe3my/9798219d-d695-44ba-ac50-1a0b70e05a70.jpg" alt="Official ICON MUN masquerade emblem" className="h-full w-full rounded-full border border-[#c6a66a]/70 object-cover" />
          </div>
        </div>

        <div ref={lineRef} className="mb-6 h-px w-28 sm:w-36" style={{ background: 'linear-gradient(90deg, transparent, #c6a66a, transparent)' }} />
        <h1 ref={wordmarkRef} className="font-cinzel text-3xl font-semibold uppercase sm:text-5xl" style={{ color: '#f0e5ce', textShadow: '0 0 32px rgba(198,166,106,0.13)' }}>ICON MUN</h1>
        <p ref={taglineRef} className="mt-5 max-w-md text-[10px] uppercase tracking-[0.24em] text-[#b8b0a0] sm:text-xs sm:tracking-[0.32em]">Behind the Masquerade of Global Diplomacy</p>
        <p className="mt-8 font-mono text-[9px] tracking-[0.38em] text-[#8f805f]">RIYADH · 2027</p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 h-[2px]" style={{ background: 'rgba(231,219,195,0.12)' }}><div ref={progressRef} className="h-full" style={{ background: 'linear-gradient(90deg, #8d6c36, #e7dbc3, #8d6c36)', transform: 'scaleX(0)' }} /></div>
      <button type="button" onClick={finishIntro} aria-label="Skip intro animation" className="absolute right-5 top-5 z-30 rounded-full border px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] transition-colors hover:bg-[#e7dbc3]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7dbc3]" style={{ borderColor: 'rgba(231,219,195,0.35)', color: '#e7dbc3', background: 'rgba(9,9,8,0.55)' }}>Skip <span aria-hidden="true">↗</span></button>
    </div>
  );
};
