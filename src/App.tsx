import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CinematicIntro } from './components/CinematicIntro';
import { Navigation } from './components/Navigation';
import { HeroCanvasScrubber } from './components/HeroCanvasScrubber';
import { AboutSection } from './components/AboutSection';
import { CommitteesSection } from './components/CommitteesSection';
import { ScheduleSection } from './components/ScheduleSection';
import { SecretariatSection } from './components/SecretariatSection';
import { RegistrationSection } from './components/RegistrationSection';
import { FooterSection } from './components/FooterSection';
import { CustomCursor } from './components/CustomCursor';
import { AudioAmbience } from './components/AudioAmbience';
import { GlobalScrollEffects } from './components/GlobalScrollEffects';
import { GoldDustCanvas } from './components/GoldDustCanvas';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedCommitteeCode, setSelectedCommitteeCode] = useState<string>('UNSC');
  const [showNavLogo, setShowNavLogo] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis and GSAP ScrollTrigger Synchronization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    // Connect Lenis to ScrollTrigger without triggering component state updates
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger after fonts settle
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const handleIntroComplete = useCallback(() => {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
  }, []);

  const handleNavigateTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, {
        offset: sectionId === 'hero-scroll-container' ? 0 : -20,
        duration: 1.3,
      });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleOpenRegister = useCallback((committeeCode?: string) => {
    if (committeeCode) {
      setSelectedCommitteeCode(committeeCode);
    }
    setIsRegisterOpen(true);
  }, []);

  const handleCloseRegister = useCallback(() => {
    setIsRegisterOpen(false);
  }, []);

  const handleVideoReady = useCallback(() => {
    setIsVideoReady(true);
    ScrollTrigger.refresh();
  }, []);

  const handleHeroScrollProgress = useCallback((p: number) => {
    const isPast = p > 0.22;
    setShowNavLogo((prev) => (prev !== isPast ? isPast : prev));
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#E6E1D8] selection:bg-[#D4AF6A]/20 selection:text-[#F3DFA2] overflow-x-hidden">
      {/* 1. Cinematic Intro (plays once, curtain splits on hero readiness) */}
      <CinematicIntro
        isHeroReady={isVideoReady}
        onComplete={handleIntroComplete}
      />

      {/* 2. Global Floating Gold Dust Particles with Swirl Physics */}
      <GoldDustCanvas />

      {/* 3. Global Scroll Effects: Top Thin Progress Bar, Dot Nav, Faint Rotating UN Globe */}
      <GlobalScrollEffects onNavigateTo={handleNavigateTo} />

      {/* 4. Custom Gold Ring Cursor */}
      <CustomCursor />

      {/* 5. Sound Toggle (Off by default as specified) */}
      <AudioAmbience />

      {/* 6. Top Navigation (Brand logo hidden until hero title scrolls away) */}
      <Navigation
        onOpenRegister={handleOpenRegister}
        showBrandLogo={showNavLogo}
      />

      {/* 7. Primary Hero Section with Bidirectional Video Scrubbing */}
      <main>
        <HeroCanvasScrubber
          onHeroReady={handleVideoReady}
          onHeroProgressChange={handleHeroScrollProgress}
        />

        {/* 8. Pinned & Scroll-Scrubbed Sections (No one-shot triggers) */}
        <AboutSection />
        <CommitteesSection onSelectCommitteeForRegister={handleOpenRegister} />
        <ScheduleSection />
        <SecretariatSection />
        <RegistrationSection
          isOpenModal={isRegisterOpen}
          onCloseModal={handleCloseRegister}
          onOpenModal={handleOpenRegister}
          preselectedCommittee={selectedCommitteeCode}
        />
      </main>

      {/* 9. Scroll-Scrubbed Footer */}
      <FooterSection />
    </div>
  );
}
