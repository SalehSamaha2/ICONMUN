import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const borderPathRef = useRef<SVGRectElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    const ctx = gsap.context(() => {
      // Entrance Timeline that plays once smoothly and locks in place
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          once: true,
        },
      });

      // 1. Heading rises in
      if (headingRef.current) {
        tl.fromTo(
          headingRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
        );
      }

      // 2. Card container unmasks with subtle scale
      tl.fromTo(
        card,
        { opacity: 0, y: 25, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out' },
        '-=0.5'
      );

      // 3. SVG Gold border draws itself
      if (borderPathRef.current) {
        tl.fromTo(
          borderPathRef.current,
          { strokeDashoffset: 2800 },
          { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out' },
          '-=0.7'
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-transparent text-ink overflow-hidden"
    >
      <div className="mx-auto max-w-5xl relative z-10">
        {/* Section Header */}
        <div ref={headingRef} className="text-center max-w-2xl mx-auto mb-10 md:mb-12 will-change-transform">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-gold mb-2">
            <span>Diplomatic Mandate</span>
            <span aria-hidden="true" className="text-golddeep">·</span>
            <span>ICON MUN 2027</span>
          </div>
          <h2 className="font-cinzel text-[clamp(1.75rem,5vw,3rem)] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-gold-gradient text-balance">
            Behind The Masquerade
          </h2>
          <div className="mx-auto mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>

        {/* Transparent Gold Bordered Card with SVG Stroke Draw */}
        <div
          ref={cardRef}
          className="relative rounded-2xl p-6 sm:p-10 lg:p-16 bg-transparent border border-gold/30 shadow-[0_0_35px_rgba(0,0,0,0.6)] will-change-transform"
        >
          {/* SVG Frame Drawing on Scroll */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl" fill="none">
            <rect
              ref={borderPathRef}
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="16"
              stroke="#E7DBC3"
              strokeWidth="1.5"
              strokeDasharray="2800"
              strokeDashoffset="2800"
              className="opacity-70"
            />
          </svg>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Logo Emblem Thumbnail */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="relative h-56 w-56 sm:h-64 sm:w-64 rounded-full bg-[#E7DBC3]/90 flex items-center justify-center shadow-[0_0_50px_rgba(231,219,195,0.2)]">
                <img
                  src="/brand/logo-cutout.webp"
                  alt="ICON MUN emblem"
                  className="h-[84%] w-[84%] object-contain"
                  loading="lazy"
                />
              </div>
              <p className="mt-3 font-cinzel text-xs uppercase tracking-[0.25em] text-gold text-contrast">
                ICON MUN 2027
              </p>
            </div>

            {/* Narrative Prose */}
            <div className="lg:col-span-8 space-y-4">
              <p className="text-sm sm:text-base leading-relaxed text-inkstrong font-medium text-contrast">
                Welcome to ICON MUN 2027. In world diplomacy, every sovereign delegation brings ambition, perspective, and dedication to the floor.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-inkstrong font-medium text-contrast">
                Official conference guidelines, council configurations, and procedural announcements are currently being codified by the High Secretariat. All conference information is To Be Announced (TBA).
              </p>

              {/* Status and Information Cards: Explicitly TBA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-ink/10 text-center">
                <div className="space-y-1">
                  <div className="font-cinzel text-2xl sm:text-3xl font-bold text-accent font-mono">
                    2027
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ink3">
                    Edition
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-cinzel text-2xl sm:text-3xl font-bold text-accent font-mono">
                    TBA
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ink3">
                    Councils
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-cinzel text-2xl sm:text-3xl font-bold text-accent font-mono">
                    TBA
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ink3">
                    Dates
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-cinzel text-2xl sm:text-3xl font-bold text-accent font-mono">
                    TBA
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ink3">
                    Venue
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
