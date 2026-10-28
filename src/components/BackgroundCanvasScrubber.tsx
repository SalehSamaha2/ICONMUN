import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GoldDustCanvas } from './GoldDustCanvas';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 80;
const FRAME_URL = (n: number) =>
  `/assets/silhouette-frames/frame_${String(n).padStart(3, '0')}.jpg`;

interface BackgroundCanvasScrubberProps {
  className?: string;
}

/**
 * Calculates normalized scroll progress [0, 1] across the entire document height.
 * 0.0 = Top of page
 * 0.5 = Exact midpoint of the page
 * 1.0 = Bottom of page
 */
function getDocumentScrollProgress(): number {
  if (typeof window === 'undefined') return 0;
  const scrollY = window.pageYOffset ?? document.documentElement.scrollTop ?? window.scrollY ?? 0;
  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.offsetHeight,
    document.body.offsetHeight
  );
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const maxScroll = Math.max(docHeight - viewportHeight, 1);
  return Math.min(Math.max(scrollY / maxScroll, 0), 1);
}

export const BackgroundCanvasScrubber: React.FC<BackgroundCanvasScrubberProps> = ({
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFirstFrameReady, setIsFirstFrameReady] = useState(false);

  // Preloaded frame image buffer and readiness bitmask
  const framesRef = useRef<HTMLImageElement[]>(new Array(TOTAL_FRAMES));
  const readyRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));

  // Physics and rendering states (zero React re-renders on scroll)
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const viewportSizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const viewDirtyRef = useRef<boolean>(true);

  // Resize handler with DPR cap for retina clarity and performance
  const updateViewportSize = useCallback(() => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

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

  // Nearest frame that is fully ready to paint (never flickers or shows empty screen)
  const pickReadyFrame = useCallback((idx: number) => {
    const ready = readyRef.current;
    if (ready[idx]) return idx;
    for (let d = 1; d < TOTAL_FRAMES; d++) {
      if (idx - d >= 0 && ready[idx - d]) return idx - d;
      if (idx + d < TOTAL_FRAMES && ready[idx + d]) return idx + d;
    }
    return -1;
  }, []);

  // Draw active frame with centered cover fit
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const srcIdx = pickReadyFrame(frameIdx);
    if (srcIdx < 0) return;

    // Skip redundant paints if nothing changed
    if (srcIdx === lastDrawnFrameRef.current && !viewDirtyRef.current) return;

    const img = framesRef.current[srcIdx];
    if (!img || img.naturalWidth === 0) return;

    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d', { alpha: false });
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { width: targetW, height: targetH, dpr } = viewportSizeRef.current;
    if (targetW === 0 || targetH === 0) return;

    lastDrawnFrameRef.current = srcIdx;
    viewDirtyRef.current = false;

    // Centered object-fit cover
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const r = Math.max(targetW / iw, targetH / ih);
    const nw = iw * r;
    const nh = ih * r;
    const ox = (targetW - nw) / 2;
    const oy = (targetH - nh) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(img, ox, oy, nw, nh);
  }, [pickReadyFrame]);

  // Update target frame from global document scroll
  const updateScrollProgress = useCallback(() => {
    const progress = getDocumentScrollProgress();
    // Maps 0.0 at top of site to frame 0, and 1.0 at bottom of site to frame (TOTAL_FRAMES - 1)
    targetFrameRef.current = progress * (TOTAL_FRAMES - 1);
  }, []);

  // Master render ticker: 60fps momentum glide that smoothly eases to target frame
  useEffect(() => {
    const tick = (_time: number, deltaTime: number) => {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.01) {
        // Frame-rate independent exponential smoothing
        const dt = Math.min(Math.max(deltaTime || 16.7, 1), 50);
        const k = 1 - Math.pow(1 - 0.24, dt / 16.667);
        currentFrameRef.current = current + diff * k;
      } else {
        currentFrameRef.current = target;
      }

      const frameToDraw = Math.min(
        Math.max(Math.round(currentFrameRef.current), 0),
        TOTAL_FRAMES - 1
      );

      drawFrame(frameToDraw);
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [drawFrame]);

  // Load frame sequence: Frame 1 immediately for instant paint, then remaining in pool
  useEffect(() => {
    updateViewportSize();
    let cancelled = false;

    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    framesRef.current = images;
    readyRef.current = new Uint8Array(TOTAL_FRAMES);
    lastDrawnFrameRef.current = -1;
    viewDirtyRef.current = true;

    const loadImage = (n: number) =>
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
        img.src = FRAME_URL(n);
      });

    // Background download pool for frames 2 through TOTAL_FRAMES
    const startRemainingFrames = () => {
      const queue: number[] = [];
      for (let n = 2; n <= TOTAL_FRAMES; n++) queue.push(n);
      const MAX_PARALLEL = 6;
      let active = 0;

      const pump = () => {
        while (!cancelled && active < MAX_PARALLEL && queue.length) {
          const n = queue.shift()!;
          active++;
          loadImage(n)
            .then((img) => {
              if (cancelled) return;
              images[n - 1] = img;
              readyRef.current[n - 1] = 1;
            })
            .catch(() => {
              /* missing frame falls back to pickReadyFrame automatically */
            })
            .finally(() => {
              active--;
              pump();
            });
        }
      };
      pump();
    };

    // 1. Priority load frame 1 (The opening female silhouette wearing the mask)
    loadImage(1)
      .then((img) => {
        if (cancelled) return;
        images[0] = img;
        readyRef.current[0] = 1;
        setIsFirstFrameReady(true);
        updateViewportSize();
        updateScrollProgress();
        drawFrame(0);
        startRemainingFrames();
      })
      .catch(() => {
        if (cancelled) return;
        startRemainingFrames();
      });

    // 2. Scroll and resize listeners
    const onScroll = () => {
      updateScrollProgress();
    };

    const onResize = () => {
      updateViewportSize();
      updateScrollProgress();
      drawFrame(Math.round(currentFrameRef.current));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // 3. ScrollTrigger integration across full document
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: () => {
        updateScrollProgress();
      },
    });

    return () => {
      cancelled = true;
      trigger.kill();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('touchmove', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [drawFrame, updateScrollProgress, updateViewportSize]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505] select-none ${className}`}
    >
      {/* Hardware-Accelerated 2D Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover select-none block transition-opacity duration-500 ${
          isFirstFrameReady ? 'opacity-90' : 'opacity-40'
        }`}
      />

      {/* Atmospheric Edge Vignette to blend smoothly into #050505 */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(circle at center, transparent 38%, rgba(5,5,5,0.55) 75%, #050505 100%)',
        }}
      />

      {/* Subtle Floating Gold Dust Layer */}
      <GoldDustCanvas className="z-15 opacity-60" />
    </div>
  );
};
