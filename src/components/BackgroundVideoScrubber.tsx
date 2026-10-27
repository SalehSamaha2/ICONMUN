import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GoldDustCanvas } from './GoldDustCanvas';

gsap.registerPlugin(ScrollTrigger);

const FORWARD_SRC = '/assets/masque-forward.mp4';
const REVERSE_SRC = '/assets/masque-reverse.mp4';

/**
 * Calculates normalized scroll progress [0, 1] across the entire document height.
 * 0.0 = Top of page
 * 1.0 = Bottom of page (Footer)
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

interface BackgroundVideoScrubberProps {
  className?: string;
}

/**
 * Velocity-Driven Dual Video Engine.
 * Plays the forward video natively when scrolling down and the reverse video natively
 * when scrolling up, with playbackRate dynamically matching scroll speed.
 * Delivers native 60fps hardware-accelerated playback with zero seek hitching.
 */
export const BackgroundVideoScrubber: React.FC<BackgroundVideoScrubberProps> = ({
  className = '',
}) => {
  const forwardVideoRef = useRef<HTMLVideoElement | null>(null);
  const reverseVideoRef = useRef<HTMLVideoElement | null>(null);

  const [activeDirection, setActiveDirection] = useState<'forward' | 'reverse'>('forward');
  const [isReady, setIsReady] = useState(false);

  // Performance tracking refs (0 React state re-renders during active scrolling)
  const lastScrollYRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(10.027);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const directionRef = useRef<'forward' | 'reverse'>('forward');

  // Pause videos smoothly when scrolling rests without forced seeking jumps
  const handleScrollStop = useCallback(() => {
    const fwd = forwardVideoRef.current;
    const rev = reverseVideoRef.current;
    if (fwd && !fwd.paused) {
      fwd.pause();
    }
    if (rev && !rev.paused) {
      rev.pause();
    }
  }, []);

  // Handle active scroll with velocity-driven playback
  const handleScroll = useCallback(() => {
    const fwd = forwardVideoRef.current;
    const rev = reverseVideoRef.current;
    if (!fwd || !rev) return;

    const currentY = window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
    const now = performance.now();
    const deltaY = currentY - lastScrollYRef.current;
    const deltaTime = Math.max(now - lastScrollTimeRef.current, 10);

    lastScrollYRef.current = currentY;
    lastScrollTimeRef.current = now;

    // Reset idle pause timer
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }
    stopTimeoutRef.current = setTimeout(handleScrollStop, 90);

    if (Math.abs(deltaY) < 1) return;

    const progress = getDocumentScrollProgress();
    const duration = durationRef.current;
    const targetFwd = Math.min(Math.max(progress * (duration - 0.04), 0.001), duration - 0.02);
    const targetRev = Math.min(Math.max((1 - progress) * (duration - 0.04), 0.001), duration - 0.02);

    // Calculate normalized velocity (pixels per ms)
    const velocity = Math.abs(deltaY) / deltaTime;
    // Map velocity to dynamic playback rate between 1.0x and 3.0x
    const speed = Math.min(Math.max(velocity * 1.8, 1.0), 3.0);

    if (deltaY > 0) {
      // SCROLLING DOWN -> PLAY FORWARD VIDEO
      if (directionRef.current !== 'forward') {
        directionRef.current = 'forward';
        setActiveDirection('forward');
        // Align forward video currentTime from reverse position
        try {
          fwd.currentTime = targetFwd;
        } catch {
          /* ignore */
        }
      }

      rev.pause();
      fwd.playbackRate = speed;

      // Soft anchor check: only nudge if drift exceeds 0.5s to avoid stutter
      if (Math.abs(fwd.currentTime - targetFwd) > 0.55) {
        fwd.currentTime = targetFwd;
      }

      if (fwd.paused) {
        fwd.play().catch(() => {});
      }
    } else {
      // SCROLLING UP -> PLAY REVERSE VIDEO
      if (directionRef.current !== 'reverse') {
        directionRef.current = 'reverse';
        setActiveDirection('reverse');
        // Align reverse video currentTime from forward position
        try {
          rev.currentTime = targetRev;
        } catch {
          /* ignore */
        }
      }

      fwd.pause();
      rev.playbackRate = speed;

      // Soft anchor check: only nudge if drift exceeds 0.5s to avoid stutter
      if (Math.abs(rev.currentTime - targetRev) > 0.55) {
        rev.currentTime = targetRev;
      }

      if (rev.paused) {
        rev.play().catch(() => {});
      }
    }
  }, [handleScrollStop]);

  // Initial setup and metadata handler
  useEffect(() => {
    const fwd = forwardVideoRef.current;
    const rev = reverseVideoRef.current;
    if (!fwd || !rev) return;

    const onMeta = () => {
      if (fwd.duration && !isNaN(fwd.duration)) {
        durationRef.current = fwd.duration;
      }
      setIsReady(true);
      fwd.pause();
      rev.pause();
      const p = getDocumentScrollProgress();
      fwd.currentTime = p * durationRef.current;
      rev.currentTime = (1 - p) * durationRef.current;
    };

    fwd.addEventListener('loadedmetadata', onMeta);
    if (fwd.readyState >= 1) {
      onMeta();
    }

    lastScrollYRef.current = window.pageYOffset ?? 0;
    lastScrollTimeRef.current = performance.now();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      fwd.removeEventListener('loadedmetadata', onMeta);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, [handleScroll]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505] select-none ${className}`}
    >
      {/* Forward Video (Active when scrolling down) */}
      <video
        ref={forwardVideoRef}
        src={FORWARD_SRC}
        playsInline
        webkit-playsinline="true"
        muted
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
          activeDirection === 'forward' ? 'opacity-90' : 'opacity-0'
        }`}
      />

      {/* Reverse Video (Active when scrolling up) */}
      <video
        ref={reverseVideoRef}
        src={REVERSE_SRC}
        playsInline
        webkit-playsinline="true"
        muted
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
          activeDirection === 'reverse' ? 'opacity-90' : 'opacity-0'
        }`}
      />

      {/* Atmospheric Edge Vignette to blend edges */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(circle at center, transparent 45%, rgba(5,5,5,0.4) 80%, rgba(5,5,5,0.85) 100%)',
        }}
      />

      {/* Subtle Floating Gold Dust Layer */}
      <GoldDustCanvas className="z-15 opacity-40" />
    </div>
  );
};

export default BackgroundVideoScrubber;
