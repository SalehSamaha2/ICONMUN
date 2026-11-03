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

  const handleCanPlay = useCallback(() => {
    setIsVideoReady(true);
    const video = videoRef.current;
    if (video && video.paused) {
      video.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // GSAP ScrollTrigger hook: cinematic camera push smoothly tied to scroll position
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cameraPush: gsap.core.Tween | null = null;
    if (!isReduced && video) {
      cameraPush = gsap.fromTo(
        video,
        { scale: 1.0, transformOrigin: 'center center', force3D: true },
        {
          scale: 1.12,
          ease: 'none',
          scrollTrigger: {
            start: 0,
            end: 'max',
            scrub: 1.0,
          },
        }
      );
    }

    // Touch/pointer fallback unlocker for mobile autoplay policies
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
      cameraPush?.kill();
      window.removeEventListener('pointerdown', unlocker);
      window.removeEventListener('touchstart', unlocker);
    };
  }, []);

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
