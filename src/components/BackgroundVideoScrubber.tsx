import React, { useCallback, useEffect, useRef } from 'react';
import { GoldDustCanvas } from './GoldDustCanvas';

const LOCAL_VIDEO_SRC = '/assets/carpet-walking.mp4';
const FALLBACK_VIDEO_SRC = 'https://res.cloudinary.com/edtur3gp/video/upload/v1793132424/Edit_video_carpet_and_walking_700dd39e.mp4';

function getScrollProgress(scrollY?: number): number {
  if (typeof window === 'undefined') return 0;
  const root = document.documentElement;
  const body = document.body;
  const maxScroll = Math.max(root.scrollHeight, body.scrollHeight, root.offsetHeight, body.offsetHeight) - window.innerHeight;
  const currentScroll = typeof scrollY === 'number' && Number.isFinite(scrollY) ? scrollY : window.scrollY;
  return maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, currentScroll / maxScroll));
}

/**
 * Fluid 60fps Native Video Engine.
 * - Hardware-accelerated continuous playback (native 60fps video, not stepped stills).
 * - Modulates playbackRate proportional to scroll momentum across the full page height.
 * - Gentle deceleration when resting; holds current frame without abrupt stops.
 * - Zero resets: clamped strictly at the footer, holding the final frame permanently.
 */
export const BackgroundVideoScrubber: React.FC<{ className?: string }> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const durationRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const isPlayPendingRef = useRef(false);

  // Safe play to prevent interrupting asynchronous promises
  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.paused || isPlayPendingRef.current) return;

    // Never call play if we are at or near the end of the video to prevent browser auto-rewind
    const duration = durationRef.current;
    if (duration > 0 && video.currentTime >= duration - 0.08) return;

    isPlayPendingRef.current = true;
    const promise = video.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          isPlayPendingRef.current = false;
        })
        .catch(() => {
          isPlayPendingRef.current = false;
        });
    } else {
      isPlayPendingRef.current = false;
    }
  }, []);

  // Safe pause that respects in-flight play promises
  const safePause = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused) return;

    if (isPlayPendingRef.current) {
      setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }, 50);
    } else {
      video.pause();
    }
  }, []);

  // Gentle deceleration on scroll rest
  const handleScrollRest = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused) return;

    // Smoothly ease down playback rate before pausing
    video.playbackRate = 0.5;

    if (decelTimerRef.current) clearTimeout(decelTimerRef.current);
    decelTimerRef.current = setTimeout(() => {
      safePause();
    }, 70);
  }, [safePause]);

  const handleScrollInput = useCallback((event?: Event) => {
    const video = videoRef.current;
    if (!video) return;

    const detail = (event as CustomEvent<{ scroll?: number }> | undefined)?.detail;
    const currentScrollY = typeof detail?.scroll === 'number' && Number.isFinite(detail.scroll) ? detail.scroll : window.scrollY;
    const now = performance.now();
    const deltaY = currentScrollY - lastScrollYRef.current;
    const deltaTime = Math.max(now - lastScrollTimeRef.current, 10);

    lastScrollYRef.current = currentScrollY;
    lastScrollTimeRef.current = now;

    // Reset idle timers
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (decelTimerRef.current) clearTimeout(decelTimerRef.current);
    stopTimerRef.current = setTimeout(handleScrollRest, 130);

    // Filter tiny sub-pixel tremors
    if (Math.abs(deltaY) < 0.8) return;

    const duration = durationRef.current;
    if (duration <= 0) return;

    const progress = getScrollProgress(currentScrollY);
    const maxEnd = Math.max(0, duration - 0.08);
    const targetTime = progress >= 0.995 ? maxEnd : Math.min(Math.max(progress * maxEnd, 0.001), maxEnd);

    if (deltaY > 0) {
      // SCROLLING DOWN:
      if (progress >= 0.995) {
        // At the bottom of the page (footer): hold cleanly on the final frame forever
        safePause();
        if (Math.abs(video.currentTime - maxEnd) > 0.08) {
          try { video.currentTime = maxEnd; } catch { /* ignore */ }
        }
        return;
      }

      const drift = targetTime - video.currentTime;

      // Teleport only on massive discontinuous jumps (e.g. clicking navigation links)
      if (Math.abs(drift) > 4.5) {
        try { video.currentTime = targetTime; } catch { /* ignore */ }
      } else if (drift > 0.03) {
        // Video is behind scroll progress: play forward at native 60fps with rate matching velocity
        const velocity = Math.abs(deltaY) / deltaTime;
        const baseSpeed = Math.min(Math.max(velocity * 1.5, 0.85), 2.0);
        const rate = Math.min(Math.max(baseSpeed * (1.0 + drift * 0.4), 0.75), 2.2);
        video.playbackRate = rate;

        if (video.paused && video.currentTime < maxEnd) {
          safePlay();
        }
      } else if (drift < -0.1) {
        // Video reached or slightly passed current scroll depth: gently slow down so it doesn't outrun progress
        video.playbackRate = 0.65;
      }
    } else {
      // SCROLLING UP:
      // When scrolling upward, smoothly ease back toward earlier frames
      safePause();
      if (video.currentTime > targetTime + 0.2 || targetTime - video.currentTime < -2.0) {
        try { video.currentTime = targetTime; } catch { /* ignore */ }
      }
    }
  }, [handleScrollRest, safePlay, safePause]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMetadata = () => {
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 10.0;
      video.playbackRate = 1.0;
      video.pause();

      const initialProgress = getScrollProgress();
      if (durationRef.current > 0) {
        const initialTarget = initialProgress * Math.max(0, durationRef.current - 0.08);
        try { video.currentTime = initialTarget; } catch { /* ignore */ }
      }
    };

    // When reaching the end, hold the final frame and never rewind
    const onEnded = () => {
      safePause();
      const duration = durationRef.current;
      if (duration > 0) {
        try { video.currentTime = Math.max(0, duration - 0.08); } catch { /* ignore */ }
      }
    };

    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('durationchange', onMetadata);
    video.addEventListener('ended', onEnded);

    window.addEventListener('scroll', handleScrollInput, { passive: true });
    window.addEventListener('resize', handleScrollInput, { passive: true });
    window.addEventListener('icon-mun-scroll', handleScrollInput);

    if (video.readyState >= 1) onMetadata();

    lastScrollYRef.current = window.scrollY;

    return () => {
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('durationchange', onMetadata);
      video.removeEventListener('ended', onEnded);
      window.removeEventListener('scroll', handleScrollInput);
      window.removeEventListener('resize', handleScrollInput);
      window.removeEventListener('icon-mun-scroll', handleScrollInput);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (decelTimerRef.current) clearTimeout(decelTimerRef.current);
    };
  }, [handleScrollInput, safePause]);

  return (
    <div aria-hidden="true" className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#100609] select-none ${className}`}>
      <video
        ref={videoRef}
        playsInline
        muted
        preload="auto"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: 'center center' }}
      >
        <source src={LOCAL_VIDEO_SRC} type="video/mp4" />
        <source src={FALLBACK_VIDEO_SRC} type="video/mp4" />
      </video>
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,4,10,.18) 0%, rgba(18,4,10,.26) 45%, rgba(8,3,5,.78) 100%), radial-gradient(ellipse at center, transparent 34%, rgba(8,3,5,.52) 100%)',
        }}
      />
      <GoldDustCanvas className="z-15 opacity-25" />
    </div>
  );
};

export default BackgroundVideoScrubber;
