import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, Sparkles, ArrowRight, ShieldCheck, Globe, Calendar, Award } from 'lucide-react';
import { GoldDustCanvas } from './GoldDustCanvas';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  onHeroReady?: () => void;
  onHeroProgressChange?: (progress: number) => void;
  onOpenRegister?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onHeroReady,
  onHeroProgressChange,
  onOpenRegister,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const emblemRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (onHeroReady) {
      onHeroReady();
    }

    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Entrance animation for hero elements
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (emblemRef.current) {
        tl.fromTo(
          emblemRef.current,
          { opacity: 0, scale: 0.85, y: -20 },
          { opacity: 1, scale: 1, y: 0, duration: 1.2 },
          0.1
        );
      }

      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, y: 30, letterSpacing: '0.4em' },
          { opacity: 1, y: 0, letterSpacing: '0.24em', duration: 1.2 },
          0.2
        );
      }

      if (contentRef.current) {
        tl.fromTo(
          contentRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 1.0 },
          0.4
        );
      }

      // Parallax & scroll progress tracking
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          if (onHeroProgressChange) {
            onHeroProgressChange(self.progress);
          }
          if (auraRef.current) {
            auraRef.current.style.transform = `scale(${1 + self.progress * 0.3}) translateY(${self.progress * 40}px)`;
            auraRef.current.style.opacity = `${Math.max(0.15, 0.45 - self.progress * 0.5)}`;
          }
        },
      });
    }, container);

    return () => ctx.revert();
  }, [onHeroProgressChange, onHeroReady]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      id="hero-scroll-container"
      data-theme="dark"
      className="relative w-full min-h-screen bg-paper flex flex-col justify-between overflow-hidden pt-20 pb-10"
    >
      {/* Interactive Gold Dust Particle Canvas */}
      <GoldDustCanvas className="opacity-75" />

      {/* Ambient Lighting & Glow Orbs */}
      <div
        ref={auraRef}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[560px] md:w-[750px] h-[340px] sm:h-[560px] md:h-[750px] rounded-full z-0 transition-transform duration-300 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(231,219,195,0.22) 0%, rgba(205,191,159,0.10) 35%, rgba(15,15,15,0) 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Decorative Golden Concentric Rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
        <div className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full border border-gold/15 animate-[spin_120s_linear_infinite]" />
        <div className="absolute w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full border border-dashed border-gold/10 animate-[spin_90s_linear_infinite_reverse]" />
      </div>

      {/* Soft Vignette Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-5"
        style={{
          background:
            'radial-gradient(circle at center, transparent 30%, rgba(5,5,5,0.5) 75%, #050505 100%)',
        }}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto my-auto">
        {/* Emblem Crest */}
        <div
          ref={emblemRef}
          className="relative mb-6 group cursor-pointer"
          onClick={() => scrollToSection('about')}
        >
          <div className="relative h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 rounded-full bg-[#E7DBC3] p-1.5 flex items-center justify-center shadow-[0_0_60px_rgba(231,219,195,0.35)] transition-transform duration-500 group-hover:scale-105">
            <img
              src="/brand/logo-cutout.webp"
              alt="ICON MUN Emblem"
              className="h-[88%] w-[88%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            />
            {/* Soft pulsing gold halo */}
            <div className="absolute inset-0 rounded-full border border-gold/40 animate-ping opacity-20 pointer-events-none" />
          </div>
        </div>

        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-surface/80 backdrop-blur-md text-[clamp(0.65rem,1.8vw,0.75rem)] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-gold mb-4 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
          <span>The Premier Model United Nations</span>
          <span aria-hidden="true" className="text-golddeep">·</span>
          <span>2027 Edition</span>
        </div>

        {/* Main Title */}
        <h1
          ref={titleRef}
          className="font-cinzel text-[clamp(2.5rem,8vw,5.5rem)] font-black uppercase tracking-[0.18em] sm:tracking-[0.24em] md:tracking-[0.3em] text-gold-shimmer filter drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)] whitespace-nowrap"
          style={{
            textShadow: '0 0 40px rgba(231, 219, 195, 0.4), 0 0 80px rgba(60, 52, 40, 0.25)',
          }}
        >
          ICON MUN
        </h1>

        {/* Secondary Title & Tagline */}
        <div ref={contentRef} className="space-y-6 mt-2 max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.35em] text-ink3 font-medium">
            Where Diplomacy Meets Distinction
          </p>

          <p className="text-sm sm:text-base leading-relaxed text-ink2/90 font-light max-w-xl mx-auto text-balance">
            Gathering aspiring diplomats, strategists, and changemakers to engage in high-level multilateral debate, consensus building, and global resolution.
          </p>

          {/* Quick Pillars / Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 max-w-xl mx-auto border-y border-gold/15">
            <div className="flex flex-col items-center p-2 rounded-lg bg-surface/40 border border-gold/10">
              <ShieldCheck className="w-4 h-4 text-gold mb-1" />
              <span className="font-cinzel text-sm sm:text-base font-bold text-accent">5 Councils</span>
              <span className="text-[9px] uppercase tracking-wider text-ink4">Simulation</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-surface/40 border border-gold/10">
              <Globe className="w-4 h-4 text-gold mb-1" />
              <span className="font-cinzel text-sm sm:text-base font-bold text-accent">300+</span>
              <span className="text-[9px] uppercase tracking-wider text-ink4">Delegates</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-surface/40 border border-gold/10">
              <Calendar className="w-4 h-4 text-gold mb-1" />
              <span className="font-cinzel text-sm sm:text-base font-bold text-accent">3 Days</span>
              <span className="text-[9px] uppercase tracking-wider text-ink4">Debate & Gala</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-surface/40 border border-gold/10">
              <Award className="w-4 h-4 text-gold mb-1" />
              <span className="font-cinzel text-sm sm:text-base font-bold text-accent">Awards</span>
              <span className="text-[9px] uppercase tracking-wider text-ink4">Excellence</span>
            </div>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => scrollToSection('committees')}
              className="gold-btn-primary w-full sm:w-auto px-7 py-3 text-xs font-bold uppercase tracking-[0.22em] rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl min-h-[46px]"
            >
              <span>Explore Councils</span>
              <ArrowRight className="w-4 h-4 text-gold" />
            </button>

            {onOpenRegister && (
              <button
                type="button"
                onClick={onOpenRegister}
                className="gold-btn w-full sm:w-auto px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] rounded-sm flex items-center justify-center gap-2 cursor-pointer min-h-[46px] hover:border-gold"
              >
                <span>Register Interest</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-xs uppercase tracking-[0.2em] text-ink3 hover:text-accent transition-colors py-2 px-3 min-h-[44px] inline-flex items-center"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Prompt */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-gold/70 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-mono select-none pt-4">
        <span>Scroll to Explore</span>
        <button
          type="button"
          onClick={() => scrollToSection('about')}
          aria-label="Scroll down to About section"
          className="p-1 hover:text-gold transition-colors cursor-pointer"
        >
          <ChevronDown className="h-4 w-4 animate-bounce text-gold" />
        </button>
      </div>
    </div>
  );
};
