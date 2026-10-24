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

  // Preloaded + pre-decoded frame images
  const framesRef = useRef<HTMLImageElement[]>([]);
  const readyRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const currentRenderFrameRef = useRef(0);
  const targetRenderFrameRef = useRef(0);
  const drawnSourceRef = useRef(-1); // frame index actually painted last
  const viewDirtyRef = useRef(true); // true after resize -> force a repaint
  const isFirstFrameLoadedRef = useRef(false);
  const nativeSizeRef = useRef({ w: 0, h: 0 });

  // Cached viewport sizes to avoid DOM reading during draw
  const viewportSizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  // Update canvas dimensions cache.
  // The backing store is capped to the source frame's native resolution: drawing a
  // 1280px frame into a 2880px retina canvas only burns GPU time for no extra detail.
  const updateViewportSize = useCallback(() => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const { w: iw, h: ih } = nativeSizeRef.current;
    if (iw > 0 && ih > 0) {
      const cover = Math.max(w / iw, h / ih); // css px per source px
      dpr = Math.max(0.5, Math.min(dpr, 1 / cover));
    }

    viewportSizeRef.current = { width: w, height: h, dpr };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      viewDirtyRef.current = true;
    }
  }, []);

  // Nearest frame that is fully loaded + decoded (so a not-yet-loaded frame never
  // makes the hero freeze or flash; it shows the closest available one instead).
  const pickReadyFrame = (idx: number) => {
    const ready = readyRef.current;
    if (ready[idx]) return idx;
    for (let d = 1; d < TOTAL_FRAMES; d++) {
      if (idx - d >= 0 && ready[idx - d]) return idx - d;
      if (idx + d < TOTAL_FRAMES && ready[idx + d]) return idx + d;
    }
    return -1;
  };

  // Render a specific frame onto the canvas with centered cover fit
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const src = pickReadyFrame(frameIdx);
    if (src < 0) return;
    // Nothing new to paint
    if (src === drawnSourceRef.current && !viewDirtyRef.current) return;

    const img = framesRef.current[src];
    if (!img || img.naturalWidth === 0) return;

    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d', { alpha: false });
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { width: targetW, height: targetH, dpr } = viewportSizeRef.current;
    if (targetW === 0 || targetH === 0) return;

    drawnSourceRef.current = src;
    viewDirtyRef.current = false;

    // Object-fit cover logic centered directly on the mannequin
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const r = Math.max(targetW / iw, targetH / ih);
    const nw = iw * r;
    const nh = ih * r;
    const ox = (targetW - nw) / 2;
    const oy = (targetH - nh) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(img, ox, oy, nw, nh);
  }, []);

  // Render loop. It runs on GSAP's ticker, AFTER Lenis has updated the scroll position
  // in the same frame (App registers Lenis with priority), so there is no one-frame lag.
  // The easing is frame-rate independent (same feel at 60Hz, 120Hz or a laggy frame).
  useEffect(() => {
    const tick = (_time: number, deltaTime: number) => {
      if (useVideoFallback || !isFirstFrameLoadedRef.current) return;

      const target = targetRenderFrameRef.current;
      const current = currentRenderFrameRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.05) {
        const dt = Math.min(Math.max(deltaTime || 16.7, 1), 50);
        const k = 1 - Math.pow(1 - 0.28, dt / 16.667);
        currentRenderFrameRef.current = current + diff * k;
      } else {
        currentRenderFrameRef.current = target;
      }

      const frameToDraw = Math.min(
        Math.max(Math.round(currentRenderFrameRef.current), 0),
        TOTAL_FRAMES - 1
      );
      drawFrame(frameToDraw);
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [drawFrame, useVideoFallback]);

  // Frame loading: frame 1 first for an instant paint, then the rest through a small
  // download pool. Every frame is decode()d before it counts as ready, so the first
  // time it is drawn during scroll there is no JPEG-decode hitch.
  useEffect(() => {
    updateViewportSize();

    let cancelled = false;
    const isMobile = window.innerWidth <= 768;
    const preferredFolder = isMobile ? '/assets/frames-mobile' : '/assets/frames';
    const fallbackFolder = '/assets/frames';

    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    framesRef.current = images;
    readyRef.current = new Uint8Array(TOTAL_FRAMES);
    drawnSourceRef.current = -1;
    viewDirtyRef.current = true;

    const frameUrl = (folder: string, n: number) =>
      `${folder}/frame_${String(n).padStart(3, '0')}.jpg`;

    // Resolve once the image is decoded (or give up on decode and still resolve)
    const loadImage = (n: number, folder: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode().then(() => resolve(img), () => resolve(img));
          } else {
            resolve(img);
          }
        };
        img.onerror = () => reject(new Error(`frame ${n} failed`));
        img.src = frameUrl(folder, n);
      });

    const loadWithFallback = async (n: number) => {
      try {
        return await loadImage(n, preferredFolder);
      } catch (e) {
        if (preferredFolder === fallbackFolder) throw e;
        return await loadImage(n, fallbackFolder);
      }
    };

    const startRemaining = () => {
      const queue: number[] = [];
      for (let n = 2; n <= TOTAL_FRAMES; n++) queue.push(n);
      const MAX_PARALLEL = isMobile ? 4 : 6;
      let active = 0;
      let finished = 0;

      const pump = () => {
        while (!cancelled && active < MAX_PARALLEL && queue.length) {
          const n = queue.shift()!;
          active++;
          loadWithFallback(n)
            .then((img) => {
              if (cancelled) return;
              images[n - 1] = img;
              readyRef.current[n - 1] = 1;
            })
            .catch(() => {
              /* a missing frame is skipped; nearest ready frame is shown instead */
            })
            .finally(() => {
              active--;
              finished++;
              if (finished === TOTAL_FRAMES - 1 && !cancelled) ScrollTrigger.refresh();
              pump();
            });
        }
      };
      pump();
    };

    loadWithFallback(1)
      .then((img) => {
        if (cancelled) return;
        images[0] = img;
        readyRef.current[0] = 1;
        nativeSizeRef.current = { w: img.naturalWidth, h: img.naturalHeight };
        isFirstFrameLoadedRef.current = true;
        updateViewportSize(); // re-run now that the native size is known
        drawFrame(0);
        if (onHeroReady) onHeroReady();
        startRemaining();
      })
      .catch(() => {
        if (cancelled) return;
        setUseVideoFallback(true);
        if (onHeroReady) onHeroReady();
      });

    const handleResize = () => {
      updateViewportSize();
      drawFrame(Math.round(currentRenderFrameRef.current));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      cancelled = true;
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
