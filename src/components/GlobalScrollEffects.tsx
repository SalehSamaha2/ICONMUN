import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GlobalScrollEffectsProps {
  onNavigateTo: (sectionId: string) => void;
}

const SECTIONS = [
  { id: 'hero-scroll-container', label: '01. The Masquerade', short: 'Hero' },
  { id: 'about', label: '02. Diplomatic Mandate', short: 'About' },
  { id: 'committees', label: '03. Councils of Power', short: 'Committees' },
  { id: 'schedule', label: '04. Timeline of Statecraft', short: 'Timeline' },
  { id: 'secretariat', label: '05. High Secretariat', short: 'Secretariat' },
  { id: 'registration', label: '06. Accreditations', short: 'Register' },
];

export const GlobalScrollEffects: React.FC<GlobalScrollEffectsProps> = ({
  onNavigateTo,
}) => {
  const [activeSection, setActiveSection] = useState('hero-scroll-container');
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const globeSvgRef = useRef<SVGSVGElement | null>(null);
  const activeSectionRef = useRef('hero-scroll-container');
  const globeAngleRef = useRef(0);

  useEffect(() => {
    let lastScroll = window.scrollY;

    // Use GSAP ScrollTrigger so it shares the single Lenis/GSAP loop
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const p = self.progress;

        // 1. Direct DOM update of top progress bar using transform ONLY
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${p})`;
        }

        // 2. Rotate background UN globe via transform ONLY
        const currentScroll = window.scrollY;
        const scrollDiff = currentScroll - lastScroll;
        lastScroll = currentScroll;
        globeAngleRef.current += scrollDiff * 0.05;
        if (globeSvgRef.current) {
          globeSvgRef.current.style.transform = `rotate(${globeAngleRef.current}deg)`;
        }

        // 3. Track active section
        for (let i = SECTIONS.length - 1; i >= 0; i--) {
          const sec = SECTIONS[i];
          const el = document.getElementById(sec.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.45) {
              if (activeSectionRef.current !== sec.id) {
                activeSectionRef.current = sec.id;
                setActiveSection(sec.id);
              }
              break;
            }
          }
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <>
      {/* 1. Thin Fixed Gold Progress Bar at Top (transform: scaleX ONLY) */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-white/5">
        <div
          ref={progressBarRef}
          className="h-full w-full bg-gradient-to-r from-[#8C6221] via-[#D4AF6A] to-[#FFF3D6] shadow-[0_0_12px_rgba(212,175,106,0.8)] origin-left will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* 2. Faint Huge UN-Style Globe Fixed in Background (transform: rotate ONLY) */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.06] select-none">
        <svg
          ref={globeSvgRef}
          viewBox="0 0 1000 1000"
          className="w-[1200px] h-[1200px] max-w-none text-[#D4AF6A] will-change-transform"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <circle cx="500" cy="500" r="470" strokeDasharray="6 8" strokeWidth="1" />
          <circle cx="500" cy="500" r="450" strokeWidth="1.5" />
          <circle cx="500" cy="500" r="390" strokeWidth="1" opacity="0.6" />

          <circle cx="500" cy="500" r="320" strokeDasharray="3 4" />
          <circle cx="500" cy="500" r="240" />
          <circle cx="500" cy="500" r="160" strokeDasharray="3 4" />
          <circle cx="500" cy="500" r="80" />
          <circle cx="500" cy="500" r="6" fill="currentColor" />

          {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165].map((angle) => (
            <line
              key={angle}
              x1="500"
              y1="50"
              x2="500"
              y2="950"
              transform={`rotate(${angle} 500 500)`}
              opacity="0.5"
            />
          ))}

          {Array.from({ length: 24 }).map((_, i) => {
            const rot = i * 15;
            return (
              <path
                key={i}
                d="M 500 40 C 490 20, 500 10, 500 0 C 500 10, 510 20, 500 40"
                transform={`rotate(${rot} 500 500)`}
                fill="currentColor"
                opacity="0.75"
              />
            );
          })}
        </svg>
      </div>

      {/* 3. Fixed Dot Navigation on Right Side */}
      <nav
        aria-label="Section Navigation"
        className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4 py-3"
      >
        <div className="flex flex-col items-center gap-3 rounded-full border border-[#D4AF6A]/20 bg-[#0A0A0A]/70 px-2 py-3 backdrop-blur-md shadow-2xl">
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            const isHovered = hoveredDot === sec.id;

            return (
              <div key={sec.id} className="relative flex items-center justify-end group">
                <div
                  className={`pointer-events-none absolute right-7 whitespace-nowrap rounded border border-[#D4AF6A]/30 bg-[#0F0F0F]/95 px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-[#F3DFA2] shadow-xl backdrop-blur-md transition-all duration-200 ${
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
                    <span className="absolute inset-0 rounded-full border border-[#D4AF6A] animate-ping opacity-60" />
                  )}

                  <span
                    className={`rounded-full transition-all duration-300 ${
                      isActive
                        ? 'h-2.5 w-2.5 bg-[#FFF3D6] shadow-[0_0_10px_#F3DFA2]'
                        : 'h-1.5 w-1.5 bg-[#D4AF6A]/40 group-hover:bg-[#D4AF6A] group-hover:scale-125'
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
