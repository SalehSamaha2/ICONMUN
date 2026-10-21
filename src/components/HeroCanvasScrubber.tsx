import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroCanvasScrubberProps {
  onHeroReady?: () => void;
  onHeroProgressChange?: (progress: number) => void;
}

const TOTAL_FRAMES = 96;

export const HeroCanvasScrubber: React.FC<HeroCanvasScrubberProps> = ({
  onHeroReady,
  onHeroProgressChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const videoFallbackRef = useRef<HTMLVideoElement | null>(null);

  const [useVideoFallback, setUseVideoFallback] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Preloaded frame images cache
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameIndexRef = useRef(0);
  const isFirstFrameLoadedRef = useRef(false);

  // Render a specific frame onto the canvas
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const img = framesRef.current[frameIdx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Ensure canvas dimensions match viewport
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Cover positioning
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const r = Math.max(cw / iw, ch / ih);
    const nw = iw * r;
    const nh = ih * r;
    const ox = (cw - nw) / 2;
    const oy = (ch - nh) / 2;

    ctx.drawImage(img, ox, oy, nw, nh);
  }, []);

  // Preload frame 1 immediately, then the rest in background
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Load Frame 1 first for immediate paint
    const firstImg = new Image();
    firstImg.src = '/assets/frames/frame_0001.webp';
    firstImg.onload = () => {
      isFirstFrameLoadedRef.current = true;
      drawFrame(0);
      if (onHeroReady) onHeroReady();
    };
    firstImg.onerror = () => {
      // If frames don't exist, switch to video fallback
      setUseVideoFallback(true);
      if (onHeroReady) onHeroReady();
    };
    images.push(firstImg);

    // Preload remaining 95 frames
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(4, '0');
      img.src = `/assets/frames/frame_${numStr}.webp`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES - 1) {
          ScrollTrigger.refresh();
        }
      };
      images.push(img);
    }

    framesRef.current = images;

    const handleResize = () => {
      drawFrame(currentFrameIndexRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame, onHeroReady]);

  // Master ScrollTrigger Timeline for Hero (Pinned 250vh desktop, 180vh mobile, scrub: 0.5)
  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        pin: sticky,
        pinSpacing: true,
        scrub: 0.5, // Short smoothing for instantaneous responsiveness
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProgress(p);
          if (onHeroProgressChange) {
            onHeroProgressChange(p);
          }

          // Frame mapping
          const targetIndex = Math.min(
            Math.max(Math.floor(p * (TOTAL_FRAMES - 1)), 0),
            TOTAL_FRAMES - 1
          );

          if (currentFrameIndexRef.current !== targetIndex) {
            currentFrameIndexRef.current = targetIndex;
            if (!useVideoFallback) {
              drawFrame(targetIndex);
            }
          }

          // Fallback video scrubbing if active
          if (useVideoFallback && videoFallbackRef.current) {
            const v = videoFallbackRef.current;
            if (v.duration) {
              v.currentTime = p * v.duration;
            }
          }
        },
      });
    }, container);

    return () => ctx.revert();
  }, [drawFrame, onHeroProgressChange, useVideoFallback]);

  // Dynamic transforms (Transform and Opacity ONLY)
  const canvasScale = 1 + scrollProgress * 0.06; // slight scale 1 -> 1.06
  const glowOpacity = Math.min(scrollProgress * 1.4, 0.75); // gold glow overlay fades in
  const exitOpacity = scrollProgress > 0.88 ? Math.max(0, 1 - (scrollProgress - 0.88) / 0.12) : 1;

  // Caption 1: 0–30% "Every nation has a face."
  const getCaption1Style = () => {
    if (scrollProgress < 0.22) return { opacity: 1, transform: 'translateY(0px)' };
    if (scrollProgress <= 0.32) {
      const exit = (scrollProgress - 0.22) / 0.1;
      return { opacity: 1 - exit, transform: `translateY(-${exit * 16}px)` };
    }
    return { opacity: 0, transform: 'translateY(-16px)' };
  };

  // Caption 2: 30–65% "But behind every mask…"
  const getCaption2Style = () => {
    if (scrollProgress < 0.28) return { opacity: 0, transform: 'translateY(16px)' };
    if (scrollProgress <= 0.38) {
      const enter = (scrollProgress - 0.28) / 0.1;
      return { opacity: enter, transform: `translateY(${(1 - enter) * 16}px)` };
    }
    if (scrollProgress <= 0.58) return { opacity: 1, transform: 'translateY(0px)' };
    if (scrollProgress <= 0.68) {
      const exit = (scrollProgress - 0.58) / 0.1;
      return { opacity: 1 - exit, transform: `translateY(-${exit * 16}px)` };
    }
    return { opacity: 0, transform: 'translateY(-16px)' };
  };

  // Caption 3: 65–100% "…is a delegate ready to lead."
  const getCaption3Style = () => {
    if (scrollProgress < 0.64) return { opacity: 0, transform: 'translateY(16px)' };
    if (scrollProgress <= 0.74) {
      const enter = (scrollProgress - 0.64) / 0.1;
      return { opacity: enter, transform: `translateY(${(1 - enter) * 16}px)` };
    }
    return { opacity: 1, transform: 'translateY(0px)' };
  };

  return (
    <div
      ref={containerRef}
      id="hero-scroll-container"
      className="relative w-full bg-[#050505] h-[180vh] md:h-[250vh]"
    >
      {/* Pinned Viewport Hero Section */}
      <div
        ref={stickyRef}
        className="h-screen w-full overflow-hidden bg-[#050505] flex flex-col justify-between"
      >
        {/* Visual Media Layer: Canvas Frame Sequence (with video fallback) */}
        <div
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            transform: `scale(${canvasScale})`,
            opacity: exitOpacity,
          }}
        >
          {/* WebP Frame Sequence Canvas (Preferred) */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover select-none block"
          />

          {/* Fallback MP4 Video (if frames are absent) */}
          {useVideoFallback && (
            <video
              ref={videoFallbackRef}
              src="/assets/mask-video.mp4"
              playsInline
              muted
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          )}
        </div>

        {/* Radial Gold Glow Overlay (Opacity Only) */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full z-10 will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(212,175,106,0.35) 0%, rgba(90,15,30,0.2) 45%, transparent 70%)',
            opacity: glowOpacity,
          }}
        />

        {/* Soft Radial Vignette Overlay (Static, no heavy CSS animations) */}
        <div
          className="pointer-events-none absolute inset-0 z-15"
          style={{
            background:
              'radial-gradient(circle at center, transparent 35%, rgba(5,5,5,0.65) 80%, #050505 100%)',
          }}
        />

        {/* ================================================================= */}
        {/* SAFE ZONE 1 (TOP): SINGLE "ICON MUN" HTML TITLE                   */}
        {/* ================================================================= */}
        <div className="relative z-20 pt-10 sm:pt-14 px-6 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF6A] mb-2 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            <span>The Premier Model United Nations</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>Geneva Accords</span>
          </div>

          <h1
            className="font-cinzel text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[0.25em] md:tracking-[0.32em] text-gold-shimmer filter drop-shadow-[0_6px_30px_rgba(0,0,0,0.95)]"
            style={{
              textShadow: '0 0 35px rgba(212, 175, 106, 0.4), 0 0 70px rgba(90, 15, 30, 0.25)',
            }}
          >
            ICON MUN
          </h1>

          <p className="mt-2 text-xs sm:text-sm uppercase tracking-[0.3em] text-[#E6E1D8]/80 font-light max-w-md text-balance drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Behind The Masquerade Of Global Diplomacy
          </p>
        </div>

        {/* SAFE ZONE 2 (MIDDLE): CLEAR SPACE AROUND MANNEQUIN */}
        <div className="flex-1 pointer-events-none" />

        {/* ================================================================= */}
        {/* SAFE ZONE 3 (BOTTOM): SWAPPING SCROLL-SCRUBBED CAPTIONS           */}
        {/* ================================================================= */}
        <div className="relative z-20 pb-10 sm:pb-14 px-6 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          <div className="relative h-16 w-full max-w-xl flex items-center justify-center">
            {/* Caption 1: 0–30% */}
            <div
              className="absolute inset-x-0 will-change-transform"
              style={getCaption1Style()}
            >
              <p className="font-cinzel text-xl sm:text-2xl md:text-3xl text-gold-gradient font-medium tracking-[0.16em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                Every nation has a face.
              </p>
              <span className="block mt-1 text-[10px] sm:text-xs tracking-[0.25em] text-[#C4BAA8] uppercase font-light">
                Prologue · The Diplomatic Mask
              </span>
            </div>

            {/* Caption 2: 30–65% */}
            <div
              className="absolute inset-x-0 will-change-transform"
              style={getCaption2Style()}
            >
              <p className="font-cinzel text-xl sm:text-2xl md:text-3xl text-gold-gradient font-medium tracking-[0.16em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                But behind every mask…
              </p>
              <span className="block mt-1 text-[10px] sm:text-xs tracking-[0.25em] text-[#C4BAA8] uppercase font-light">
                Movement · The Veil Dissolves
              </span>
            </div>

            {/* Caption 3: 65–100% */}
            <div
              className="absolute inset-x-0 will-change-transform"
              style={getCaption3Style()}
            >
              <p className="font-cinzel text-xl sm:text-2xl md:text-3xl text-gold-gradient font-medium tracking-[0.16em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                …is a delegate ready to lead.
              </p>
              <span className="block mt-1 text-[10px] sm:text-xs tracking-[0.25em] text-[#C4BAA8] uppercase font-light">
                Resolution · The Sovereign Mandate
              </span>
            </div>
          </div>

          {/* Small Scroll Prompt (Fades out quickly) */}
          <div
            className="flex flex-col items-center justify-center mt-2 transition-opacity duration-200"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 15),
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#D4AF6A] font-medium">
              <span>Scroll to Scrub Mask</span>
              <ChevronDown className="h-3 w-3 animate-bounce text-[#F3DFA2]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
