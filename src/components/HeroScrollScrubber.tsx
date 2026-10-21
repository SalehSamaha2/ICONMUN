import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, Sliders, Film, Layers, Check, Sparkles, Upload } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroScrollScrubberProps {
  onVideoReady?: () => void;
  onHeroScrollProgress?: (progress: number) => void;
}

type ScrubMode = 'video-optimized' | 'video-original' | 'canvas-frames';

const VIDEO_OPTIMIZED_PATH = '/assets/mask-video.mp4';
const VIDEO_ORIGINAL_PATH = '/assets/aistudio/Mannequin_lifts_gold_masquerade___20261021142552_a8b133d8.mp4';
const TOTAL_CANVAS_FRAMES = 96;

export const HeroScrollScrubber: React.FC<HeroScrollScrubberProps> = ({
  onVideoReady,
  onHeroScrollProgress,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const headGlowRef = useRef<HTMLDivElement | null>(null);

  // States
  const [videoDuration, setVideoDuration] = useState(8.0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrubMode, setScrubMode] = useState<ScrubMode>('video-optimized');
  const [showSettings, setShowSettings] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [framesLoadedCount, setFramesLoadedCount] = useState(0);

  // Canvas frames cache
  const framesRef = useRef<HTMLImageElement[]>([]);

  // Internal lerp physics
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const isSeekingRef = useRef(false);

  const currentVideoSrc = customVideoUrl || (scrubMode === 'video-original' ? VIDEO_ORIGINAL_PATH : VIDEO_OPTIMIZED_PATH);

  // Preload canvas frames in background for alternate mode
  useEffect(() => {
    let loaded = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= TOTAL_CANVAS_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(3, '0');
      img.src = `/assets/frames/frame_${numStr}.jpg`;
      img.onload = () => {
        loaded++;
        setFramesLoadedCount(loaded);
      };
      img.onerror = () => {
        loaded++;
      };
      images.push(img);
    }
    framesRef.current = images;
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && !isNaN(video.duration)) {
      setVideoDuration(video.duration);
      ScrollTrigger.refresh();
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    if (onVideoReady) {
      onVideoReady();
    }
    ScrollTrigger.refresh();
  }, [onVideoReady]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (customVideoUrl) {
        URL.revokeObjectURL(customVideoUrl);
      }
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
      setScrubMode('video-optimized');
    }
  };

  const renderCanvasFrame = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas || framesRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameIndex = Math.min(
      Math.max(Math.floor(progress * (TOTAL_CANVAS_FRAMES - 1)), 0),
      TOTAL_CANVAS_FRAMES - 1
    );

    const img = framesRef.current[frameIndex];
    if (img && img.complete && img.naturalWidth > 0) {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

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
    }
  }, []);

  const onHeroScrollProgressRef = useRef(onHeroScrollProgress);
  useEffect(() => {
    onHeroScrollProgressRef.current = onHeroScrollProgress;
  }, [onHeroScrollProgress]);

  const scrollProgressRef = useRef(0);

  // Main scroll-scrub loop with GSAP ScrollTrigger synchronization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;

    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        scrollProgressRef.current = p;
        setScrollProgress(p);
        if (onHeroScrollProgressRef.current) {
          onHeroScrollProgressRef.current(p);
        }

        const video = videoRef.current;
        const dur = (video && video.duration && !isNaN(video.duration)) ? video.duration : videoDuration;
        targetTimeRef.current = p * dur;
      },
    });

    // 60fps lerp loop for smooth bidirectional video scrubbing
    const lerpLoop = () => {
      const video = videoRef.current;

      const diff = targetTimeRef.current - currentTimeRef.current;
      currentTimeRef.current += diff * 0.16;

      if (scrubMode !== 'canvas-frames' && video && video.readyState >= 2) {
        const timeDiff = Math.abs(video.currentTime - currentTimeRef.current);
        if (timeDiff > 0.008 && !isSeekingRef.current) {
          try {
            video.currentTime = currentTimeRef.current;
          } catch {
            // ignore aborted seek queue
          }
        }
      }

      if (scrubMode === 'canvas-frames') {
        renderCanvasFrame(scrollProgressRef.current);
      }

      animId = requestAnimationFrame(lerpLoop);
    };

    animId = requestAnimationFrame(lerpLoop);

    return () => {
      st.kill();
      cancelAnimationFrame(animId);
    };
  }, [scrubMode, videoDuration, renderCanvasFrame]);

  // Video seeking flags
  const handleSeeking = () => {
    isSeekingRef.current = true;
  };
  const handleSeeked = () => {
    isSeekingRef.current = false;
  };

  // Caption 1: 0–30% "Every nation has a face."
  const getCaption1Style = () => {
    if (scrollProgress < 0.22) {
      return { opacity: 1, transform: 'translateY(0px)' };
    }
    if (scrollProgress <= 0.32) {
      const exit = (scrollProgress - 0.22) / 0.1;
      return { opacity: 1 - exit, transform: `translateY(-${exit * 18}px)` };
    }
    return { opacity: 0, transform: 'translateY(-20px)' };
  };

  // Caption 2: 30–65% "But behind every mask…"
  const getCaption2Style = () => {
    if (scrollProgress < 0.28) {
      return { opacity: 0, transform: 'translateY(20px)' };
    }
    if (scrollProgress <= 0.38) {
      const enter = (scrollProgress - 0.28) / 0.1;
      return { opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` };
    }
    if (scrollProgress <= 0.58) {
      return { opacity: 1, transform: 'translateY(0px)' };
    }
    if (scrollProgress <= 0.68) {
      const exit = (scrollProgress - 0.58) / 0.1;
      return { opacity: 1 - exit, transform: `translateY(-${exit * 18}px)` };
    }
    return { opacity: 0, transform: 'translateY(-20px)' };
  };

  // Caption 3: 65–100% "…is a delegate ready to lead."
  const getCaption3Style = () => {
    if (scrollProgress < 0.64) {
      return { opacity: 0, transform: 'translateY(20px)' };
    }
    if (scrollProgress <= 0.74) {
      const enter = (scrollProgress - 0.64) / 0.1;
      return { opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` };
    }
    if (scrollProgress <= 0.90) {
      return { opacity: 1, transform: 'translateY(0px)' };
    }
    // At very end of hero, fades into black transition
    const endFade = (scrollProgress - 0.90) / 0.1;
    return { opacity: Math.max(0, 1 - endFade), transform: `translateY(-${endFade * 15}px)` };
  };

  // Video transform calculations:
  // As mask comes off: video scales from 1 to 1.1, glow grows, vignette lightens, end darkens
  const videoScale = 1 + scrollProgress * 0.1;
  const glowOpacity = Math.min(scrollProgress * 1.5, 0.7);
  const endDarkenOpacity = scrollProgress > 0.85 ? (scrollProgress - 0.85) / 0.15 : 0;

  return (
    <div
      ref={containerRef}
      id="hero-scroll-container"
      className="relative w-full bg-[#050505] h-[300vh] md:h-[500vh]"
    >
      {/* Pinned Viewport Container */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#050505] flex flex-col justify-between"
      >
        {/* Subtle Film Grain Layer */}
        <div className="film-grain pointer-events-none absolute inset-0 z-20 opacity-30" />

        {/* Dynamic Vignette (lightens as mask comes off) */}
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-150"
          style={{
            background: `radial-gradient(circle at center, transparent 35%, rgba(5, 5, 5, ${
              0.7 - scrollProgress * 0.25
            }) 75%, #050505 100%)`,
          }}
        />

        {/* Golden Aura Glow behind Mannequin Head (grows with mask removal) */}
        <div
          ref={headGlowRef}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full z-10 transition-transform duration-75"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,106,0.35) 0%, rgba(90,15,30,0.2) 45%, transparent 70%)',
            opacity: glowOpacity,
            transform: `translate(-50%, -50%) scale(${1 + scrollProgress * 0.35})`,
          }}
        />

        {/* End of Hero Transition: Video blurs and darkens into pure black */}
        <div
          className="pointer-events-none absolute inset-0 z-25 bg-[#050505] transition-opacity duration-100"
          style={{
            opacity: endDarkenOpacity,
          }}
        />

        {/* The Scrubbed Video Element */}
        {scrubMode !== 'canvas-frames' && (
          <video
            ref={videoRef}
            src={currentVideoSrc}
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onSeeking={handleSeeking}
            onSeeked={handleSeeked}
            className="absolute inset-0 h-full w-full object-cover select-none will-change-transform"
            style={{
              transform: `scale(${videoScale})`,
              filter: `contrast(1.08) brightness(${1 - endDarkenOpacity * 0.5}) blur(${endDarkenOpacity * 8}px)`,
            }}
          />
        )}

        {/* Alternative Canvas Frame Scrubber */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full object-cover will-change-transform ${
            scrubMode === 'canvas-frames' ? 'block' : 'hidden'
          }`}
          style={{
            transform: `scale(${videoScale})`,
            filter: `contrast(1.08) brightness(${1 - endDarkenOpacity * 0.5}) blur(${endDarkenOpacity * 8}px)`,
          }}
        />

        {/* ========================================================================= */}
        {/* SAFE ZONE 1 (TOP): SINGLE "ICON MUN" TITLE (Fixed safe zone, no overlap) */}
        {/* ========================================================================= */}
        <div className="relative z-30 pt-10 sm:pt-14 px-6 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          <div className="inline-flex items-center gap-3 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF6A] mb-2 opacity-90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            <span>The Premier Model United Nations</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>Geneva Accords</span>
          </div>

          <h1
            className="font-cinzel text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[0.25em] md:tracking-[0.32em] text-gold-shimmer filter drop-shadow-[0_6px_30px_rgba(0,0,0,0.95)]"
            style={{
              textShadow: '0 0 40px rgba(212, 175, 106, 0.4), 0 0 80px rgba(90, 15, 30, 0.3)',
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

        {/* ========================================================================= */}
        {/* SAFE ZONE 3 (BOTTOM): SWAPPING SCROLL-SCRUBBED CAPTIONS                   */}
        {/* ========================================================================= */}
        <div className="relative z-30 pb-12 sm:pb-16 px-6 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          <div className="relative h-20 w-full max-w-2xl flex items-center justify-center">
            {/* Caption 1: 0–30% */}
            <div
              className="absolute inset-x-0 transition-all duration-150"
              style={getCaption1Style()}
            >
              <p className="font-cinzel text-xl sm:text-2xl md:text-3xl text-gold-gradient font-medium tracking-[0.18em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                Every nation has a face.
              </p>
              <span className="block mt-1 text-[10px] sm:text-xs tracking-[0.28em] text-[#C4BAA8] uppercase font-light">
                Movement I · The Diplomatic Mask
              </span>
            </div>

            {/* Caption 2: 30–65% */}
            <div
              className="absolute inset-x-0 transition-all duration-150"
              style={getCaption2Style()}
            >
              <p className="font-cinzel text-xl sm:text-2xl md:text-3xl text-gold-gradient font-medium tracking-[0.18em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                But behind every mask…
              </p>
              <span className="block mt-1 text-[10px] sm:text-xs tracking-[0.28em] text-[#C4BAA8] uppercase font-light">
                Movement II · The Veil Dissolves
              </span>
            </div>

            {/* Caption 3: 65–100% */}
            <div
              className="absolute inset-x-0 transition-all duration-150"
              style={getCaption3Style()}
            >
              <p className="font-cinzel text-xl sm:text-2xl md:text-3xl text-gold-gradient font-medium tracking-[0.18em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                …is a delegate ready to lead.
              </p>
              <span className="block mt-1 text-[10px] sm:text-xs tracking-[0.28em] text-[#C4BAA8] uppercase font-light">
                Movement III · The Sovereign Mandate
              </span>
            </div>
          </div>

          {/* Small "Scroll" indicator at start */}
          <div
            className="flex flex-col items-center justify-center mt-3 transition-opacity duration-300"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 12),
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#D4AF6A] font-medium">
              <span>Scroll to Scrub Mask</span>
              <ChevronDown className="h-3 w-3 animate-bounce text-[#F3DFA2]" />
            </div>
            <div className="mt-1 h-6 w-[1.5px] overflow-hidden bg-white/10">
              <div className="h-1/2 w-full bg-gradient-to-b from-[#F3DFA2] to-[#B8893C] animate-[moveDown_1.8s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>

        {/* Cinematic Controls Trigger (Discreet HUD in corner) */}
        <div className="absolute top-8 right-6 z-40 pointer-events-auto">
          <button
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Toggle cinematic controls"
            className="flex items-center gap-1.5 rounded-full border border-[#D4AF6A]/30 bg-[#0A0A0A]/70 px-3 py-1.5 text-[11px] text-[#E6E1D8] backdrop-blur-md transition-colors hover:border-[#D4AF6A] hover:bg-[#141414] cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-[#D4AF6A]" />
            <span className="font-mono text-[10px] text-[#D4AF6A] tabular-nums">
              {Math.round(scrollProgress * 100)}%
            </span>
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#D4AF6A]/40 bg-[#0C0C0C]/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#F3DFA2]">
                  <Sparkles className="h-3.5 w-3.5 text-[#D4AF6A]" />
                  <span>Playback Engine</span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-xs text-[#A89D8A] hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  onClick={() => {
                    setScrubMode('video-optimized');
                    setCustomVideoUrl(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    scrubMode === 'video-optimized' && !customVideoUrl
                      ? 'border border-[#D4AF6A] bg-[#D4AF6A]/10 text-[#F3DFA2]'
                      : 'border border-white/5 bg-white/5 text-[#C4BAA8] hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Film className="h-3.5 w-3.5 text-[#D4AF6A]" />
                    <div className="text-left">
                      <div className="font-medium">Intra-frame Video (GOP 1)</div>
                      <div className="text-[10px] text-white/50">Optimal 60fps scrubbing</div>
                    </div>
                  </div>
                  {scrubMode === 'video-optimized' && !customVideoUrl && (
                    <Check className="h-3.5 w-3.5 text-[#D4AF6A]" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setScrubMode('video-original');
                    setCustomVideoUrl(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    scrubMode === 'video-original' && !customVideoUrl
                      ? 'border border-[#D4AF6A] bg-[#D4AF6A]/10 text-[#F3DFA2]'
                      : 'border border-white/5 bg-white/5 text-[#C4BAA8] hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Film className="h-3.5 w-3.5 text-[#A89D8A]" />
                    <div className="text-left">
                      <div className="font-medium">Original Upload File</div>
                      <div className="text-[10px] text-white/50">Uploaded MP4</div>
                    </div>
                  </div>
                  {scrubMode === 'video-original' && !customVideoUrl && (
                    <Check className="h-3.5 w-3.5 text-[#D4AF6A]" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setScrubMode('canvas-frames');
                    setCustomVideoUrl(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    scrubMode === 'canvas-frames'
                      ? 'border border-[#D4AF6A] bg-[#D4AF6A]/10 text-[#F3DFA2]'
                      : 'border border-white/5 bg-white/5 text-[#C4BAA8] hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-[#D4AF6A]" />
                    <div className="text-left">
                      <div className="font-medium">Canvas Frame Scrubber</div>
                      <div className="text-[10px] text-white/50">
                        {framesLoadedCount}/{TOTAL_CANVAS_FRAMES} frames
                      </div>
                    </div>
                  </div>
                  {scrubMode === 'canvas-frames' && <Check className="h-3.5 w-3.5 text-[#D4AF6A]" />}
                </button>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10">
                <label className="text-[10px] uppercase tracking-wider text-[#A89D8A] block mb-1.5">
                  Test With Custom MP4
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4AF6A]/40 bg-[#161616] py-2 text-xs text-[#D4AF6A] hover:border-[#D4AF6A] hover:bg-[#1a1a1a]">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose MP4 file</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
