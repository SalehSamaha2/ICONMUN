import React from 'react';
import { HeroSection } from './HeroSection';

interface HeroCanvasScrubberProps {
  onHeroReady?: () => void;
  onHeroProgressChange?: (progress: number) => void;
  onOpenRegister?: () => void;
}

/**
 * Re-exports HeroSection to prevent legacy imports from triggering the mask video/frames loader.
 */
export const HeroCanvasScrubber: React.FC<HeroCanvasScrubberProps> = (props) => {
  return <HeroSection {...props} />;
};
