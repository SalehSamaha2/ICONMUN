import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GoldDustCanvas } from './GoldDustCanvas';

gsap.registerPlugin(ScrollTrigger);

const VIDEO_URL =
  'https://res.cloudinary.com/edtur3gp/video/upload/v1793118876/Female_silhouette_removes_masque__20261027193210.mp4';

interface BackgroundVideoScrubberProps {
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

export const BackgroundVideoScrubber: React.FC<BackgroundVideoScrubberProps> = ({
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // High performance refs (zero React re-renders during scrolling)
  const durationRef = useRef<number>(10.027); // Known Cloudinary asset duration
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const lastSeekTimestampRef = useRef<number>(0);

  // Synchronize target time based on total document scroll progress
  const updateTargetTime = useCallback(() => {
    const progress = getDocumentScrollProgress();
    const duration = durationRef.current;
    if (duration > 0) {
      // Precise mapping: 0.001s at top of site, (duration - 0.03)s at absolute bottom
      targetTimeRef.current = Math.min(
        Math.max(progress * (duration - 0.03), 0.001),
        duration - 0.02
      );
    }
  }, []);

  // When video metadata is available, capture exact duration and render the initial frame immediately
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      durationRef.current = video.duration;
    }

    setIsVideoReady(true);
    video.pause();

    // Map initial frame based on where user is on initial load
    updateTargetTime();
    try {
      video.currentTime = targetTimeRef.current;
    } catch {
      /* ignore */
    }
  }, [updateTargetTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animId: number;

    // Direct scroll-to-progress update via passive scroll listeners & ScrollTrigger
    const onScroll = () => {
      updateTargetTime();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // GSAP ScrollTrigger across the full document body
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: () => {
        updateTargetTime();
      },
    });

    // High performance rAF loop with non-blocking seek locks
    const tick = () => {
      if (video && video.readyState >= 1) {
        const target = targetTimeRef.current;
        const current = video.currentTime;
        const diff = Math.abs(target - current);

        // Safety watchdog: If seek event hasn't fired in 70ms, release the seeking lock
        if (isSeekingRef.current && performance.now() - lastSeekTimestampRef.current > 70) {
          isSeekingRef.current = false;
        }

        // Only seek if difference exceeds threshold to avoid decoder micro-jitter
        if (!isSeekingRef.current && !video.seeking && diff > 0.015) {
          isSeekingRef.current = true;
          lastSeekTimestampRef.current = performance.now();
          video.currentTime = target;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    const handleSeeked = () => {
      isSeekingRef.current = false;
    };

    video.addEventListener('seeked', handleSeeked);
    animId = requestAnimationFrame(tick);

    // Initial calculation
    updateTargetTime();

    return () => {
      trigger.kill();
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [updateTargetTime]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505] select-none ${className}`}
    >
      {/* Cinematic Full-Site Video */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        playsInline
        webkit-playsinline="true"
        muted
        preload="auto"
        crossOrigin="anonymous"
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedMetadata}
        onCanPlay={handleLoadedMetadata}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isVideoReady ? 'opacity-90' : 'opacity-40'
        }`}
      />

      {/* Atmospheric Edge Vignette to blend seamlessly with #050505 background */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(circle at center, transparent 38%, rgba(5,5,5,0.5) 75%, #050505 100%)',
        }}
      />

      {/* Subtle Floating Gold Dust Layer */}
      <GoldDustCanvas className="z-15 opacity-60" />
    </div>
  );
};
