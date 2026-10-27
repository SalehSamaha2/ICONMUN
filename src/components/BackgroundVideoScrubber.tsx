import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoldDustCanvas } from './GoldDustCanvas';

const FORWARD_SRC = 'https://res.cloudinary.com/edtur3gp/video/upload/v1793132424/Edit_video_carpet_and_walking_700dd39e.mp4';
const REVERSE_SRC = FORWARD_SRC;

/**
 * Calculates normalized scroll progress [0, 1] across the entire document height.
 * 0.0 = Top of page (Hero)
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
 * Full-Page Scroll-Stretched Cinematic Dual Video Engine.
 * - Stretches the video timeline across the full document height (Hero = 0%, Footer = 100%).
 * - Instant reverse response on the first upward scroll motion.
 * - Hardware-accelerated rAF convergence that smoothly drives currentTime to match scroll progress.
 */
export const BackgroundVideoScrubber: React.FC<BackgroundVideoScrubberProps> = ({
  className = '',
}) => {
  const forwardVideoRef = useRef<HTMLVideoElement | null>(null);
  const reverseVideoRef = useRef<HTMLVideoElement | null>(null);

  const [activeDirection, setActiveDirection] = useState<'forward' | 'reverse'>('forward');

  const lastScrollYRef = useRef<number>(0);
  const durationRef = useRef<number>(10.027);
  const directionRef = useRef<'forward' | 'reverse'>('forward');
  const targetProgressRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Active rAF loop: smoothly steps video toward target progress and holds position
  useEffect(() => {
    const tick = () => {
      const fwd = forwardVideoRef.current;
      const rev = reverseVideoRef.current;
      const duration = durationRef.current;
      const progress = targetProgressRef.current;

      if (directionRef.current === 'forward' && fwd && fwd.readyState >= 2) {
        const target = Math.min(Math.max(progress * (duration - 0.04), 0.001), duration - 0.02);
        const diff = target - fwd.currentTime;

        if (diff > 0.06) {
          // Play forward to catch up to scroll target
          const speed = Math.min(Math.max(diff * 2.8, 0.9), 3.0);
          fwd.playbackRate = speed;
          if (fwd.paused) {
            fwd.play().catch(() => {});
          }
        } else if (diff < -0.25) {
          // If ahead of target, gently reposition or pause
          fwd.currentTime = target;
          if (!fwd.paused) {
            fwd.pause();
          }
        } else {
          // At target: hold position cleanly
          if (!fwd.paused) {
            fwd.pause();
          }
        }
      } else if (directionRef.current === 'reverse' && rev && rev.readyState >= 2) {
        const target = Math.min(Math.max((1 - progress) * (duration - 0.04), 0.001), duration - 0.02);
        const diff = target - rev.currentTime;

        if (diff > 0.06) {
          // Play reverse video forward to put the mask back on as user scrolls up
          const speed = Math.min(Math.max(diff * 2.8, 0.9), 3.0);
          rev.playbackRate = speed;
          if (rev.paused) {
            rev.play().catch(() => {});
          }
        } else if (diff < -0.25) {
          rev.currentTime = target;
          if (!rev.paused) {
            rev.pause();
          }
        } else {
          // At target: hold position cleanly
          if (!rev.paused) {
            rev.pause();
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Handle active scroll: update target progress and switch direction instantly
  const handleScroll = useCallback(() => {
    const fwd = forwardVideoRef.current;
    const rev = reverseVideoRef.current;
    const duration = durationRef.current;

    const currentY = window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
    const deltaY = currentY - lastScrollYRef.current;
    lastScrollYRef.current = currentY;

    // Filter sub-pixel jitter
    if (Math.abs(deltaY) < 0.8) return;

    const progress = getDocumentScrollProgress();
    targetProgressRef.current = progress;

    if (deltaY > 0) {
      // SCROLLING DOWN -> FORWARD VIDEO
      if (directionRef.current !== 'forward') {
        directionRef.current = 'forward';
        setActiveDirection('forward');
        if (rev && !rev.paused) rev.pause();
        if (fwd && fwd.readyState >= 2) {
          const target = Math.min(Math.max(progress * (duration - 0.04), 0.001), duration - 0.02);
          if (Math.abs(fwd.currentTime - target) > 0.4) {
            fwd.currentTime = target;
          }
        }
      }
    } else {
      // SCROLLING UP -> REVERSE VIDEO (INSTANT SWITCH)
      if (directionRef.current !== 'reverse') {
        directionRef.current = 'reverse';
        setActiveDirection('reverse');
        if (fwd && !fwd.paused) fwd.pause();
        if (rev && rev.readyState >= 2) {
          const target = Math.min(Math.max((1 - progress) * (duration - 0.04), 0.001), duration - 0.02);
          if (Math.abs(rev.currentTime - target) > 0.4) {
            rev.currentTime = target;
          }
        }
      }
    }
  }, []);

  // Initial setup and metadata handler
  useEffect(() => {
    const fwd = forwardVideoRef.current;
    const rev = reverseVideoRef.current;
    if (!fwd || !rev) return;

    const onMeta = () => {
      if (fwd.duration && !isNaN(fwd.duration)) {
        durationRef.current = fwd.duration;
      }
      fwd.pause();
      rev.pause();
      const p = getDocumentScrollProgress();
      targetProgressRef.current = p;
      fwd.currentTime = p * durationRef.current;
      rev.currentTime = (1 - p) * durationRef.current;
    };

    fwd.addEventListener('loadedmetadata', onMeta);
    if (fwd.readyState >= 1) {
      onMeta();
    }

    lastScrollYRef.current = window.pageYOffset ?? 0;
    targetProgressRef.current = getDocumentScrollProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      fwd.removeEventListener('loadedmetadata', onMeta);
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
