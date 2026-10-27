import React, { useCallback, useEffect, useRef } from 'react';
import { GoldDustCanvas } from './GoldDustCanvas';

const VIDEO_SRC = 'https://res.cloudinary.com/edtur3gp/video/upload/v1793132424/Edit_video_carpet_and_walking_700dd39e.mp4';

function getScrollProgress(): number {
  const root = document.documentElement;
  const body = document.body;
  const maxScroll = Math.max(root.scrollHeight, body.scrollHeight, root.offsetHeight, body.offsetHeight) - window.innerHeight;
  return maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / maxScroll));
}

/** Scrubs one continuous video timeline: first frame at page top, last frame at page bottom. */
export const BackgroundVideoScrubber: React.FC<{ className?: string }> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const durationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pendingProgressRef = useRef(0);

  const syncFrame = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const video = videoRef.current;
      if (!video || !durationRef.current || !Number.isFinite(durationRef.current)) return;
      const end = Math.max(0, durationRef.current - 0.04);
      const targetTime = pendingProgressRef.current >= 0.999 ? end : pendingProgressRef.current * end;
      if (Math.abs(video.currentTime - targetTime) > 0.025) {
        try { video.currentTime = targetTime; } catch { /* media may not be seekable yet */ }
      }
    });
  }, []);

  const updateProgress = useCallback(() => {
    pendingProgressRef.current = getScrollProgress();
    syncFrame();
  }, [syncFrame]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMetadata = () => {
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 0;
      video.pause();
      updateProgress();
    };
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('durationchange', onMetadata);
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    window.addEventListener('icon-mun-scroll', updateProgress);
    if (video.readyState >= 1) onMetadata();
    updateProgress();
    return () => {
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('durationchange', onMetadata);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      window.removeEventListener('icon-mun-scroll', updateProgress);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [updateProgress]);

  return (
    <div aria-hidden="true" className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#100609] select-none ${className}`}>
      <video ref={videoRef} src={VIDEO_SRC} playsInline muted preload="auto" tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: 'center center' }} />
      <div className="pointer-events-none absolute inset-0 z-10" style={{
        background: 'linear-gradient(180deg, rgba(18,4,10,.18) 0%, rgba(18,4,10,.26) 45%, rgba(8,3,5,.78) 100%), radial-gradient(ellipse at center, transparent 34%, rgba(8,3,5,.52) 100%)'
      }} />
      <GoldDustCanvas className="z-15 opacity-25" />
    </div>
  );
};

export default BackgroundVideoScrubber;
