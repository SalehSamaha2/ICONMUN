import React, { useEffect, useRef } from 'react';

const ICON_LOGO = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3L3BcEGyaQpmkmEhNe5xVxLe3my/9798219d-d695-44ba-ac50-1a0b70e05a70.jpg';

/** Scroll-driven 3D emblem. The existing ICON MUN artwork is used as the mask texture. */
export const ScrollMaskEmblem: React.FC = () => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const faceRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestScrollRef = useRef(0);

  useEffect(() => {
    const render = () => {
      rafRef.current = null;
      const stage = stageRef.current;
      const face = faceRef.current;
      if (!stage || !face) return;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, latestScrollRef.current / maxScroll));
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const spin = reducedMotion ? 0 : progress * 1080;
      const tilt = reducedMotion ? 0 : Math.sin(progress * Math.PI * 2) * 9;
      face.style.transform = `rotateY(${spin}deg) rotateX(${tilt}deg) rotateZ(${progress * 28}deg)`;
      stage.style.setProperty('--mask-progress', String(progress));
    };

    const schedule = (scrollY?: number) => {
      if (typeof scrollY === 'number' && Number.isFinite(scrollY)) latestScrollRef.current = scrollY;
      else latestScrollRef.current = window.scrollY;
      if (rafRef.current === null) rafRef.current = window.requestAnimationFrame(render);
    };

    const onLenisScroll = (event: Event) => {
      const detail = (event as CustomEvent<{ scroll?: number }>).detail;
      schedule(detail?.scroll);
    };

    latestScrollRef.current = window.scrollY;
    schedule();
    window.addEventListener('scroll', () => schedule(), { passive: true });
    window.addEventListener('icon-mun-scroll', onLenisScroll);
    window.addEventListener('resize', () => schedule(), { passive: true });

    return () => {
      window.removeEventListener('icon-mun-scroll', onLenisScroll);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={stageRef} aria-hidden="true" className="scroll-mask-stage pointer-events-none fixed inset-0 z-[1] overflow-hidden" >
      <div className="scroll-mask-aura" />
      <div className="scroll-mask-orbit scroll-mask-orbit-a" />
      <div className="scroll-mask-orbit scroll-mask-orbit-b" />
      <div className="scroll-mask-depth" ref={faceRef}>
        <div className="scroll-mask-face scroll-mask-front">
          <img src={ICON_LOGO} alt="" draggable={false} />
        </div>
        <div className="scroll-mask-face scroll-mask-back">
          <img src={ICON_LOGO} alt="" draggable={false} />
        </div>
      </div>
    </div>
  );
};

export default ScrollMaskEmblem;
