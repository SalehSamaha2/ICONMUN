import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GlobalScrollEffectsProps {
  onNavigateTo: (sectionId: string) => void;
}

const SECTIONS = [
  { id: 'hero-scroll-container', label: '01. The Prologue', short: 'Hero' },
  { id: 'constellation', label: '02. The Constellation', short: 'Constellation' },
  { id: 'about', label: '03. The Mandate', short: 'About' },
  { id: 'committees', label: '04. The Chambers', short: 'Councils' },
  { id: 'schedule', label: '05. The Timeline', short: 'Timeline' },
  { id: 'conference-info', label: '06. Visitor Guide', short: 'Guide' },
  { id: 'secretariat', label: '07. High Secretariat', short: 'Secretariat' },
  { id: 'registration', label: '08. The Registry', short: 'Register' },
];

export const GlobalScrollEffects: React.FC<GlobalScrollEffectsProps> = ({
  onNavigateTo,
}) => {
  const [activeSection, setActiveSection] = useState('hero-scroll-container');
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const activeSectionRef = useRef('hero-scroll-container');

  useEffect(() => {
    // 1. Top progress bar track
    const barTrigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${self.progress})`;
        }
      },
    });

    // 2. Pure ScrollTrigger active section listeners (no forced reflows or getBoundingClientRect)
    const sectionTriggers = SECTIONS.map((sec) => {
      const el = document.getElementById(sec.id);
      if (!el) return null;

      return ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive && activeSectionRef.current !== sec.id) {
            activeSectionRef.current = sec.id;
            setActiveSection(sec.id);
          }
        },
      });
    }).filter(Boolean);

    return () => {
      barTrigger.kill();
      sectionTriggers.forEach((st) => st?.kill());
    };
  }, []);

  return (
    <>
      {/* 1. Thin Fixed Gold Progress Bar at Top (transform: scaleX ONLY) */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-ink/5">
        <div
          ref={progressBarRef}
          className="h-full w-full bg-gradient-to-r from-golddeep via-gold to-inkstrong shadow-[0_0_12px_rgba(231,219,195,0.8)] origin-left will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* 2. Fixed Dot Navigation on Right Side (Desktop only; on mobile top bar serves progress) */}
      <nav
        aria-label="Section Navigation"
        className="hidden md:flex fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-4 py-3"
      >
        <div className="flex flex-col items-center gap-3 rounded-full border border-gold/20 bg-paper/70 px-2 py-3 backdrop-blur-md shadow-2xl">
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            const isHovered = hoveredDot === sec.id;

            return (
              <div key={sec.id} className="relative flex items-center justify-end group">
                <div
                  className={`pointer-events-none absolute right-7 whitespace-nowrap rounded border border-gold/30 bg-surface/95 px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-accent shadow-xl backdrop-blur-md transition-all duration-200 ${
                    isHovered
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 translate-x-2'
                  }`}
                >
                  {sec.label}
                </div>

                <button
                  onClick={() => onNavigateTo(sec.id)}
                  onMouseEnter={() => setHoveredDot(sec.id)}
                  onMouseLeave={() => setHoveredDot(null)}
                  aria-label={`Scroll to ${sec.short}`}
                  className="relative flex h-5 w-5 items-center justify-center cursor-pointer focus:outline-none"
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border border-gold animate-ping opacity-60" />
                  )}

                  <span
                    className={`rounded-full transition-all duration-300 ${
                      isActive
                        ? 'h-2.5 w-2.5 bg-inkstrong shadow-[0_0_10px_#F3EAD6]'
                        : 'h-1.5 w-1.5 bg-gold/40 group-hover:bg-gold group-hover:scale-125'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
};
