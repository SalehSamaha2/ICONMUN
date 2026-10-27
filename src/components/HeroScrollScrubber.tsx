import React from 'react';
import { HeroSection } from './HeroSection';

interface HeroScrollScrubberProps {
  onVideoReady?: () => void;
  onHeroScrollProgress?: (progress: number) => void;
}

export const HeroScrollScrubber: React.FC<HeroScrollScrubberProps> = ({
  onVideoReady,
  onHeroScrollProgress,
}) => {
  return (
    <HeroSection
      onHeroReady={onVideoReady}
      onHeroProgressChange={onHeroScrollProgress}
    />
  );
};
