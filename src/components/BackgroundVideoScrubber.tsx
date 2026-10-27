import React, { useCallback, useEffect, useRef } from 'react';
import { GoldDustCanvas } from './GoldDustCanvas';

const VIDEO_SRC = 'https://res.cloudinary.com/edtur3gp/video/upload/v1793132424/Edit_video_carpet_and_walking_700dd39e.mp4';

function getScrollProgress(scrollY?: number): number {
  if (typeof window === 'undefined') return 0;
  const root = document.documentElement;
  const body = document.body;
  const maxScroll = Math.max(root.scrollHeight, body.scrollHeight, root.offsetHeight, body.offsetHeight) - window.innerHeight;
  const currentScroll = typeof scrollY === 'number' && Number.isFinite(scrollY) ? scrollY : window.scrollY;
  return maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, currentScroll / maxScroll));
}

/**
 * Ultra-responsive Background Video Controller.
 * - Starts immediately on the first scroll input with zero latency.
 * - Safely handles play/pause promises to eliminate AbortError pipeline stalls.
 * - Dynamically paces playback across the entire site without looping or resetting.
 * - Holds the final frame cleanly at the footer.
 */
export const BackgroundVideoScrubber: React.FC<{ className?: string }> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const durationRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollYRef = useRef(0);
  const isPlayPendingRef = useRef(false);

  // Safe play to prevent interrupting asynchronous promises
  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.paused || isPlayPendingRef.current) return;

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
      }, 60);
    } else {
      video.pause();
    }
  }, []);

  const handleScrollInput = useCallback((event?: Event) => {
    const video = videoRef.current;
    if (!video) return;

    const detail = (event as CustomEvent<{ scroll?: number }> | undefined)?.detail;
    const currentScrollY = typeof detail?.scroll === 'number' && Number.isFinite(detail.scroll) ? detail.scroll : window.scrollY;
    const deltaY = currentScrollY - lastScrollYRef.current;
    lastScrollYRef.current = currentScrollY;

    // Reset idle timer: pause when scrolling rests
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }
    stopTimerRef.current = setTimeout(safePause, 140);

    // Filter tiny sub-pixel tremors
    if (Math.abs(deltaY) < 0.8) return;

    const duration = durationRef.current;
    if (duration <= 0) return;

    const progress = getScrollProgress(currentScrollY);
    const maxEnd = Math.max(0, duration - 0.05);
    const targetTime = progress >= 0.995 ? maxEnd : Math.min(Math.max(progress * maxEnd, 0.001), maxEnd);

    if (deltaY > 0) {
      // SCROLLING DOWN:
      if (progress >= 0.995) {
        // At the bottom of the page (footer): hold on final frame
        safePause();
        if (Math.abs(video.currentTime - maxEnd) > 0.08) {
          try { video.currentTime = maxEnd; } catch { /* ignore */ }
        }
        return;
      }

      // Calculate drift relative to target time to dynamically pace the video across the site
      const drift = targetTime - video.currentTime;

      // Teleport only on massive discontinuous jumps (e.g. clicking navigation links)
      if (Math.abs(drift) > 4.5) {
        try { video.currentTime = targetTime; } catch { /* ignore */ }
      } else {
        // Modulate rate so video naturally scales with page depth
        let speed = 1.0;
        if (drift > 0.15) {
          speed = Math.min(1.0 + drift * 0.45, 2.0);
        } else if (drift < -0.15) {
          speed = Math.max(0.7, 1.0 + drift * 0.35);
        }
        video.playbackRate = speed;
      }

      // Start playing immediately on scroll
      safePlay();
    } else {
      // SCROLLING UP:
      // When scrolling upward, align the video to earlier sections without seek storms
      safePause();
      if (video.currentTime > targetTime + 0.25 || targetTime - video.currentTime < -2.0) {
        try { video.currentTime = targetTime; } catch { /* ignore */ }
      }
    }
  }, [safePlay, safePause]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMetadata = () => {
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 0;
      video.playbackRate = 1.0;
      video.pause();

      const initialProgress = getScrollProgress();
      if (durationRef.current > 0) {
        const initialTarget = initialProgress * Math.max(0, durationRef.current - 0.05);
        try { video.currentTime = initialTarget; } catch { /* ignore */ }
      }
    };

    const onEnded = () => {
      safePause();
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
    };
  }, [handleScrollInput, safePause]);

  return (
    <div aria-hidden="true" className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#100609] select-none ${className}`}>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        playsInline
        muted
        preload="auto"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: 'center center' }}
      />
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
