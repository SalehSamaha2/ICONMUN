import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Volume2, Play } from 'lucide-react';

interface CinematicIntroProps {
  isHeroReady: boolean;
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ isHeroReady, onComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isDone, setIsDone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !!sessionStorage.getItem('icon_mun_intro_seen');
  });

  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Clean transition out of intro
  const handleFinish = useCallback(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
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
      });
    } else {
      sessionStorage.setItem('icon_mun_intro_seen', 'true');
      setIsDone(true);
      document.body.style.overflow = '';
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }
  }, []);

  // Skip Intro Handler
  const handleSkip = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    handleFinish();
  }, [handleFinish]);

  // Play video on user gesture if autoplay was blocked
  const handleUserStart = () => {
    const video = videoRef.current;
    if (!video) {
      handleFinish();
      return;
    }
    // Never leave the visitor stuck: if the video can't start within 1.5s, enter the site.
    let settled = false;
    const bail = setTimeout(() => {
      if (settled) return;
      settled = true;
      handleFinish();
    }, 1500);
    video
      .play()
      .then(() => {
        if (settled) return;
        settled = true;
        clearTimeout(bail);
        setAutoplayBlocked(false);
        setIsPlaying(true);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(bail);
        handleFinish();
      });
  };

  useEffect(() => {
    if (isDone) {
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }

    // 1. Check prefers-reduced-motion or Save-Data
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hasSaveData =
      typeof navigator !== 'undefined' &&
      'connection' in navigator &&
      (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;

    if (mediaQuery.matches || hasSaveData) {
      sessionStorage.setItem('icon_mun_intro_seen', 'true');
      setIsDone(true);
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }

    // Lock scroll during intro
    document.body.style.overflow = 'hidden';

    // 2. Max 2-second fallback on slow networks so user is never trapped
    const slowNetworkTimer = setTimeout(() => {
      if (!isPlaying) {
        setAutoplayBlocked(true);
      }
    }, 2000);

    // 3. Attempt autoplay with muted and inline attributes
    const video = videoRef.current;
    if (video) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            clearTimeout(slowNetworkTimer);
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch(() => {
            // Autoplay blocked by mobile browser policy
            setAutoplayBlocked(true);
          });
      }
    }

    return () => {
      clearTimeout(slowNetworkTimer);
      document.body.style.overflow = '';
    };
  }, [isDone, isPlaying, handleFinish]);

  // Track video time to animate bottom progress bar
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (video && bar && video.duration) {
      const p = video.currentTime / video.duration;
      bar.style.transform = `scaleX(${Math.min(1, p)})`;
    }
  };

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      data-theme="dark"
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-paper overflow-hidden select-none h-screen-dvh"
    >
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute h-[350px] sm:h-[450px] w-[350px] sm:w-[450px] rounded-full opacity-30 will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(231,219,195,0.3) 0%, rgba(60,52,40,0.15) 50%, transparent 70%)',
        }}
      />

      {/* Intro Reveal Video with Mobile Fallback Source */}
      <div className="relative z-10 w-full h-full flex items-center justify-center max-h-screen-dvh">
        <video
          ref={videoRef}
          muted
          playsInline
          webkit-playsinline="true"
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleFinish}
          className="w-full h-full object-contain max-h-[92dvh] select-none pointer-events-none"
        >
          <source src="/assets/intro-mobile.mp4" media="(max-width: 768px)" type="video/mp4" />
          <source src="/assets/intro.mp4" type="video/mp4" />
          <source src="/assets/aistudio/Gold_logo_reveal_animation_20261021182732_71a5a8e9.mp4" type="video/mp4" />
        </video>
      </div>

      {/* If Autoplay was blocked on iOS/Android: Show prominent gold "Enter" button */}
      {autoplayBlocked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-overlay backdrop-blur-sm p-6 text-center animate-in fade-in duration-300">
          <div className="h-16 w-16 mb-4 rounded-full border border-gold bg-surface2 flex items-center justify-center shadow-[0_0_25px_rgba(231,219,195,0.35)]">
            <Play className="h-7 w-7 text-accent ml-1" />
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold uppercase tracking-[0.2em] text-gold-shimmer mb-2">
            ICON MUN 2027
          </h2>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-ink2 max-w-xs mb-6 font-light">
            Behind the Masquerade of Global Diplomacy
          </p>
          <button
            onClick={handleUserStart}
            className="gold-btn-primary px-8 py-3.5 min-h-[48px] min-w-[200px] text-xs font-bold uppercase tracking-[0.25em] rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xl active:scale-95"
          >
            <span>Enter Experience</span>
          </button>
        </div>
      )}

      {/* Large Clear Skip Button (Safe Area Aware & >= 44px tap target) */}
      <button
        onClick={handleSkip}
        aria-label="Skip Intro"
        className="absolute z-40 rounded-full border border-gold/40 bg-paper/80 px-4 py-2.5 min-h-[44px] min-w-[44px] text-xs uppercase font-mono tracking-widest text-accent backdrop-blur-md transition-all hover:border-gold hover:bg-surface2 active:scale-95 cursor-pointer flex items-center justify-center"
        style={{
          top: 'max(1.25rem, env(safe-area-inset-top, 0px))',
          right: 'max(1.25rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <span>Skip →</span>
      </button>

      {/* Thin Gold Loading Progress Line at Bottom (Safe Area Aware) */}
      <div
        className="absolute left-0 right-0 h-[2.5px] bg-ink/5 z-30"
        style={{
          bottom: 'max(0px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-golddeep via-gold to-inkstrong origin-left will-change-transform"
          style={{ transform: 'scaleX(0.05)' }}
        />
      </div>
    </div>
  );
};
