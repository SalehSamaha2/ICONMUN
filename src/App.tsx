import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { CommitteesSection } from './components/CommitteesSection';
import { ScheduleSection } from './components/ScheduleSection';
import { SecretariatSection } from './components/SecretariatSection';
import { RegistrationSection } from './components/RegistrationSection';
import { FooterSection } from './components/FooterSection';
import { CustomCursor } from './components/CustomCursor';
import { GlobalScrollEffects } from './components/GlobalScrollEffects';
import { PerfHUD } from './components/PerfHUD';
import { SiteDataProvider } from './lib/SiteData';
import { BackgroundVideoScrubber } from './components/BackgroundVideoScrubber';
import { CinematicIntro } from './components/CinematicIntro';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedCommitteeCode, setSelectedCommitteeCode] = useState<string>('UNSC');
  const [showNavLogo, setShowNavLogo] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis and GSAP ScrollTrigger Synchronization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker, false, true);
    gsap.ticker.lagSmoothing(500, 33);

    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleDebouncedRefresh = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };

    window.addEventListener('resize', handleDebouncedRefresh);
    window.addEventListener('orientationchange', handleDebouncedRefresh);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleDebouncedRefresh);
      window.removeEventListener('orientationchange', handleDebouncedRefresh);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
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
    ScrollTrigger.refresh();
  }, []);

  const handleHeroScrollProgress = useCallback((p: number) => {
    const isPast = p > 0.22;
    setShowNavLogo((prev) => (prev !== isPast ? isPast : prev));
  }, []);

  return (
    <SiteDataProvider>
    <div className="relative min-h-screen bg-paper text-ink selection:bg-gold/20 selection:text-accent overflow-x-hidden">
      {/* One-time champagne-gold logo reveal, using ICON MUN's own intro footage */}
      <CinematicIntro isHeroReady={true} onComplete={() => setIntroComplete(true)} />

      {/* Cinematic Full-Site Scroll-Scrubbed Background Video */}
      <BackgroundVideoScrubber />

      {/* Global Scroll Effects: top progress bar and section navigation */}
      <GlobalScrollEffects onNavigateTo={handleNavigateTo} />

      {/* Custom Gold Ring Cursor */}
      <CustomCursor />

      {/* Top Navigation (Brand logo hidden until hero title scrolls away) */}
      <Navigation
        onOpenRegister={handleOpenRegister}
        showBrandLogo={introComplete || showNavLogo}
      />

      {/* Content Layers with Frosted Glass Panels over Background */}
      <main className="relative z-10">
        <HeroSection
          introComplete={introComplete}
          onHeroReady={handleVideoReady}
          onHeroProgressChange={handleHeroScrollProgress}
          onOpenRegister={handleOpenRegister}
        />

        {/* Pinned & scroll-scrubbed sections */}
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

      {/* Scroll-Scrubbed Footer */}
      <FooterSection />

      {/* Dev-only FPS meter: open the site with ?perf */}
      {typeof window !== 'undefined' && window.location.search.includes('perf') && <PerfHUD />}
    </div>
    </SiteDataProvider>
  );
}
