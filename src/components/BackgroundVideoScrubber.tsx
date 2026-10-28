import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GoldDustCanvas } from './GoldDustCanvas';

gsap.registerPlugin(ScrollTrigger);

const VIDEO_URL =
  'https://res.cloudinary.com/edtur3gp/video/upload/v1793171466/Create_3D_mask_animation_8bf7b23b.mp4';

interface BackgroundVideoScrubberProps {
  className?: string;
}

export const BackgroundVideoScrubber: React.FC<BackgroundVideoScrubberProps> = ({
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollYRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(Date.now());

  // Called when video is ready to play
  const handleCanPlay = useCallback(() => {
    setIsVideoReady(true);
    const video = videoRef.current;
    if (video) {
      // Ensure it starts playing smoothly on load
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          /* browser autoplay restrictions gracefully handled */
        });
      }
    }
  }, []);

  // Handle active scroll: unpauses if paused, modulates speed with velocity, pauses on idle
  const handleScrollMotion = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const now = Date.now();
    const currentY = window.pageYOffset ?? document.documentElement.scrollTop ?? window.scrollY ?? 0;
    const deltaY = Math.abs(currentY - lastScrollYRef.current);
    const deltaTime = Math.max(now - lastScrollTimeRef.current, 16);
    const velocity = deltaY / deltaTime; // pixels per ms

    lastScrollYRef.current = currentY;
    lastScrollTimeRef.current = now;

    // Dynamically adjust playback rate based on scroll velocity (1.0x to 2.2x)
    const targetRate = Math.min(Math.max(1.0 + velocity * 0.4, 0.9), 2.2);
    video.playbackRate = targetRate;

    // If currently paused, resume playback immediately
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }

    // Reset inactivity timer: pause after 350ms of no scrolling
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    pauseTimerRef.current = setTimeout(() => {
      if (video && !video.paused) {
        video.pause();
      }
    }, 350);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    lastScrollYRef.current =
      window.pageYOffset ?? document.documentElement.scrollTop ?? window.scrollY ?? 0;
    lastScrollTimeRef.current = Date.now();

    // Direct scroll and touch listeners
    const onScroll = () => handleScrollMotion();
    const onWheel = () => handleScrollMotion();
    const onTouchMove = () => handleScrollMotion();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // GSAP ScrollTrigger hook
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (Math.abs(self.getVelocity()) > 5) {
          handleScrollMotion();
        }
      },
    });

    // Touch/pointer fallback unlocker
    const unlocker = () => {
      if (video && video.paused) {
        video.play().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlocker);
      window.removeEventListener('touchstart', unlocker);
    };
    window.addEventListener('pointerdown', unlocker, { once: true });
    window.addEventListener('touchstart', unlocker, { once: true });

    return () => {
      trigger.kill();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('pointerdown', unlocker);
      window.removeEventListener('touchstart', unlocker);
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [handleScrollMotion]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505] select-none ${className}`}
    >
      {/* 3D Mask Animation Video Element with native autoPlay clearance */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        autoPlay
        playsInline
        webkit-playsinline="true"
        muted
        loop
        preload="auto"
        crossOrigin="anonymous"
        onCanPlay={handleCanPlay}
        onLoadedData={handleCanPlay}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isVideoReady ? 'opacity-90' : 'opacity-50'
        }`}
      />

      {/* Atmospheric Edge Vignette to blend seamlessly into #050505 background */}
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
