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
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const videoFallbackRef = useRef<HTMLVideoElement | null>(null);

  // Captions refs to animate with hardware-accelerated GSAP without triggering React re-renders
  const caption1Ref = useRef<HTMLParagraphElement | null>(null);
  const caption2Ref = useRef<HTMLParagraphElement | null>(null);
  const caption3Ref = useRef<HTMLParagraphElement | null>(null);

  const [useVideoFallback, setUseVideoFallback] = useState(false);

  // Preloaded frame images cache
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentRenderFrameRef = useRef(0);
  const targetRenderFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);
  const isFirstFrameLoadedRef = useRef(false);

  // Cached viewport sizes to avoid DOM reading during draw
  const viewportSizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  // Update canvas dimensions cache
  const updateViewportSize = useCallback(() => {
    if (typeof window === 'undefined') return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    viewportSizeRef.current = { width: w, height: h, dpr };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }, []);

  // Render a specific frame onto the canvas with centered mannequin cover
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let img = framesRef.current[frameIdx];
    if (!img || !img.complete || img.naturalWidth === 0) {
      img = framesRef.current[lastDrawnFrameRef.current];
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    lastDrawnFrameRef.current = frameIdx;

    const { width: targetW, height: targetH, dpr } = viewportSizeRef.current;
    if (targetW === 0 || targetH === 0) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Object-fit cover logic centered directly on the mannequin
    const cw = targetW;
    const ch = targetH;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const r = Math.max(cw / iw, ch / ih);
    const nw = iw * r;
    const nh = ih * r;
    const ox = (cw - nw) / 2;
    const oy = (ch - nh) / 2;

    ctx.drawImage(img, ox, oy, nw, nh);
    ctx.restore();
  }, []);

  // Smooth requestAnimationFrame render loop with interpolation
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (!useVideoFallback && isFirstFrameLoadedRef.current) {
        const target = targetRenderFrameRef.current;
        const current = currentRenderFrameRef.current;
        const diff = target - current;

        if (Math.abs(diff) > 0.05) {
          // Smooth buttery lerp
          currentRenderFrameRef.current = current + diff * 0.28;
          const frameToDraw = Math.min(
            Math.max(Math.round(currentRenderFrameRef.current), 0),
            TOTAL_FRAMES - 1
          );

          if (frameToDraw !== lastDrawnFrameRef.current) {
            drawFrame(frameToDraw);
          }
        } else if (Math.round(current) !== lastDrawnFrameRef.current) {
          currentRenderFrameRef.current = target;
          drawFrame(Math.round(target));
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [drawFrame, useVideoFallback]);

  // Progressive frame loading: load Frame 1 immediately, then rest in non-blocking batches
  useEffect(() => {
    updateViewportSize();

    const isMobile = window.innerWidth <= 768;
    const preferredFolder = isMobile ? '/assets/frames-mobile' : '/assets/frames';
    const fallbackFolder = '/assets/frames';

    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    // 1. Load Frame 1 first for instantaneous paint
    const firstImg = new Image();
    firstImg.src = `${preferredFolder}/frame_001.jpg`;
    firstImg.onload = () => {
      isFirstFrameLoadedRef.current = true;
      images[0] = firstImg;
      framesRef.current = images;
      drawFrame(0);
      if (onHeroReady) onHeroReady();

      // 2. Load remaining 95 frames in small non-blocking batches
      let currentIdx = 2;
      const batchSize = isMobile ? 8 : 16;

      const loadNextBatch = () => {
        if (currentIdx > TOTAL_FRAMES) {
          ScrollTrigger.refresh();
          return;
        }

        const endIdx = Math.min(currentIdx + batchSize, TOTAL_FRAMES + 1);
        for (let i = currentIdx; i < endIdx; i++) {
          const img = new Image();
          const numStr = String(i).padStart(3, '0');
          img.src = `${preferredFolder}/frame_${numStr}.jpg`;
          img.onerror = () => {
            img.src = `${fallbackFolder}/frame_${numStr}.jpg`;
          };
          images[i - 1] = img;
        }

        currentIdx = endIdx;
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(loadNextBatch);
        } else {
          setTimeout(loadNextBatch, 20);
        }
      };

      loadNextBatch();
    };

    firstImg.onerror = () => {
      firstImg.src = `${fallbackFolder}/frame_001.jpg`;
      firstImg.onerror = () => {
        setUseVideoFallback(true);
        if (onHeroReady) onHeroReady();
      };
    };

    images[0] = firstImg;
    framesRef.current = images;

    const handleResize = () => {
      updateViewportSize();
      drawFrame(Math.round(currentRenderFrameRef.current));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [drawFrame, onHeroReady, updateViewportSize]);

  // Master ScrollTrigger Timeline for Hero (Pinned 180vh mobile, 250vh desktop, smooth scrub)
  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          pin: sticky,
          pinSpacing: true,
          scrub: 0.8, // Smooth scrub for buttery transition
          onUpdate: (self) => {
            const p = self.progress;
            targetRenderFrameRef.current = p * (TOTAL_FRAMES - 1);

            if (onHeroProgressChange) {
              onHeroProgressChange(p);
            }

            // Video fallback seeking if active
            if (useVideoFallback && videoFallbackRef.current?.duration) {
              videoFallbackRef.current.currentTime = p * videoFallbackRef.current.duration;
            }
          },
        },
      });

      // 1. Subtle scale and exit fade on canvas
      if (canvasWrapRef.current) {
        tl.fromTo(
          canvasWrapRef.current,
          { scale: 1 },
          { scale: 1.05, ease: 'none', duration: 1 },
          0
        );
        tl.to(
          canvasWrapRef.current,
          { opacity: 0, ease: 'power2.in', duration: 0.12 },
          0.88
        );
      }

      // 2. Glow overlay pulsing
      if (glowRef.current) {
        tl.fromTo(
          glowRef.current,
          { opacity: 0.1, scale: 0.85 },
          { opacity: 0.65, scale: 1.15, ease: 'none', duration: 0.8 },
          0
        );
      }

      // 3. Captions sequence without React re-renders
      // Caption 1: 0 - 0.28
      if (caption1Ref.current) {
        tl.fromTo(
          caption1Ref.current,
          { opacity: 1, y: 0 },
          { opacity: 0, y: -16, ease: 'power1.inOut', duration: 0.1 },
          0.22
        );
      }

      // Caption 2: 0.28 - 0.65
      if (caption2Ref.current) {
        tl.fromTo(
          caption2Ref.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, ease: 'power1.inOut', duration: 0.1 },
          0.28
        );
        tl.to(
          caption2Ref.current,
          { opacity: 0, y: -16, ease: 'power1.inOut', duration: 0.1 },
          0.58
        );
      }

      // Caption 3: 0.65 - 1.0
      if (caption3Ref.current) {
        tl.fromTo(
          caption3Ref.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, ease: 'power1.inOut', duration: 0.12 },
          0.64
        );
      }
    }, container);

    return () => ctx.revert();
  }, [onHeroProgressChange, useVideoFallback]);

  return (
    <div
      ref={containerRef}
      id="hero-scroll-container"
      className="relative w-full bg-[#050505] h-[180vh] md:h-[250vh]"
    >
      {/* Pinned Viewport Hero Section with 100dvh fallback */}
      <div
        ref={stickyRef}
        className="h-screen-dvh w-full overflow-hidden bg-[#050505] flex flex-col justify-between"
      >
        {/* Visual Media Layer: Canvas Frame Sequence */}
        <div
          ref={canvasWrapRef}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          {/* Canvas Frame Sequence */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover select-none block"
          />

          {/* Fallback MP4 Video */}
          {useVideoFallback && (
            <video
              ref={videoFallbackRef}
              src="/assets/mask-video.mp4"
              playsInline
              webkit-playsinline="true"
              muted
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          )}
        </div>

        {/* Radial Gold Glow Overlay */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] sm:h-[480px] w-[320px] sm:w-[480px] rounded-full z-10 will-change-transform opacity-10"
          style={{
            background:
              'radial-gradient(circle, rgba(212,175,106,0.3) 0%, rgba(90,15,30,0.18) 45%, transparent 70%)',
          }}
        />

        {/* Soft Radial Vignette Overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-15"
          style={{
            background:
              'radial-gradient(circle at center, transparent 35%, rgba(5,5,5,0.6) 80%, #050505 100%)',
          }}
        />

        {/* ================================================================= */}
        {/* SAFE ZONE 1 (TOP): SINGLE "ICON MUN" HTML TITLE                   */}
        {/* ================================================================= */}
        <div
          className="relative z-20 px-4 sm:px-6 flex flex-col items-center justify-center text-center pointer-events-none select-none"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
          }}
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[clamp(0.6rem,2vw,0.75rem)] font-semibold uppercase tracking-[0.22em] sm:tracking-[0.35em] text-[#D4AF6A] mb-1 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            <span>The Premier Model United Nations</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>2027 Edition · Details TBA</span>
          </div>

          {/* Guaranteed single-line at 360px width with fluid clamp */}
          <h1
            className="font-cinzel text-[clamp(1.85rem,7.5vw,5rem)] font-black uppercase tracking-[0.16em] sm:tracking-[0.24em] md:tracking-[0.32em] text-gold-shimmer filter drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)] whitespace-nowrap"
            style={{
              textShadow: '0 0 35px rgba(212, 175, 106, 0.4), 0 0 70px rgba(90, 15, 30, 0.25)',
            }}
          >
            ICON MUN
          </h1>

          <p className="mt-1 text-[clamp(0.65rem,2.2vw,0.875rem)] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#E6E1D8]/80 font-light max-w-md text-balance drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] hidden sm:block">
            Official Conference Information To Be Announced (TBA)
          </p>
        </div>

        {/* SAFE ZONE 2 (MIDDLE): CLEAR SPACE AROUND MANNEQUIN */}
        <div className="flex-1 pointer-events-none" />

        {/* ================================================================= */}
        {/* SAFE ZONE 3 (BOTTOM): SWAPPING SCROLL-SCRUBBED CAPTIONS           */}
        {/* ================================================================= */}
        <div
          className="relative z-20 px-4 sm:px-6 flex flex-col items-center justify-center text-center pointer-events-none select-none"
          style={{
            paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Caption Box */}
          <div className="relative min-h-[3.25rem] sm:min-h-[4rem] flex items-center justify-center w-full max-w-xl">
            {/* Caption 1: 0–30% */}
            <p
              ref={caption1Ref}
              className="absolute font-cinzel text-[clamp(0.85rem,3.2vw,1.4rem)] uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[#FFF3D6] font-medium leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] will-change-transform"
            >
              Every nation has a face.
            </p>

            {/* Caption 2: 30–65% */}
            <p
              ref={caption2Ref}
              className="absolute font-cinzel text-[clamp(0.85rem,3.2vw,1.4rem)] uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[#F3DFA2] font-medium leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] opacity-0 will-change-transform"
            >
              But behind every mask…
            </p>

            {/* Caption 3: 65–100% */}
            <p
              ref={caption3Ref}
              className="absolute font-cinzel text-[clamp(0.85rem,3.2vw,1.4rem)] uppercase tracking-[0.14em] sm:tracking-[0.2em] text-gold-shimmer font-semibold leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] opacity-0 will-change-transform"
            >
              …is a delegate ready to lead.
            </p>
          </div>

          {/* Scroll Down Indicator */}
          <div className="mt-2 sm:mt-3 flex flex-col items-center gap-1 text-[#D4AF6A]/70 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-mono">
            <span className="hidden sm:inline">Scroll To Reveal</span>
            <ChevronDown className="h-4 w-4 animate-bounce text-[#D4AF6A]" />
          </div>
        </div>
      </div>
    </div>
  );
};
