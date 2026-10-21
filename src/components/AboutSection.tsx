import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const borderPathRef = useRef<SVGRectElement | null>(null);
  const stat1Ref = useRef<HTMLDivElement | null>(null);
  const stat2Ref = useRef<HTMLDivElement | null>(null);
  const stat3Ref = useRef<HTMLDivElement | null>(null);
  const stat4Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    const ctx = gsap.context(() => {
      const statsObj = { states: 0, councils: 0, hours: 0, immersion: 0 };

      // ONE Master Timeline with scrub: 0.5
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          end: 'bottom 85%',
          scrub: 0.5,
          onUpdate: () => {
            if (stat1Ref.current) stat1Ref.current.innerText = `${Math.round(statsObj.states)}+`;
            if (stat2Ref.current) stat2Ref.current.innerText = `${Math.round(statsObj.councils)}`;
            if (stat3Ref.current) stat3Ref.current.innerText = `${Math.round(statsObj.hours)}H`;
            if (stat4Ref.current) stat4Ref.current.innerText = `${Math.round(statsObj.immersion)}%`;
          },
        },
      });

      // 1. Heading rises in
      if (headingRef.current) {
        tl.fromTo(
          headingRef.current,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          0
        );
      }

      // 2. Card container unmasks with subtle scale
      tl.fromTo(
        card,
        { opacity: 0.2, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
        0.1
      );

      // 3. SVG Gold border draws itself
      if (borderPathRef.current) {
        tl.fromTo(
          borderPathRef.current,
          { strokeDashoffset: 2800 },
          { strokeDashoffset: 0, duration: 1, ease: 'none' },
          0.1
        );
      }

      // 4. Stats count up and down with scroll
      tl.to(
        statsObj,
        {
          states: 42,
          councils: 5,
          hours: 72,
          immersion: 100,
          duration: 1,
          ease: 'none',
        },
        0.2
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-24 px-6 lg:px-12 bg-[#050505] text-[#E6E1D8] overflow-hidden"
    >
      <div className="mx-auto max-w-5xl relative z-10">
        {/* Section Header */}
        <div ref={headingRef} className="text-center max-w-2xl mx-auto mb-12 will-change-transform">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-[#D4AF6A] mb-2">
            <span>Diplomatic Mandate</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>Geneva Accords</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-[0.18em] text-gold-gradient text-balance">
            Behind The Masquerade
          </h2>
          <div className="mx-auto mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-[#D4AF6A] to-transparent" />
        </div>

        {/* Gold Bordered Card with SVG Stroke Draw */}
        <div
          ref={cardRef}
          className="relative rounded-2xl p-8 sm:p-12 lg:p-16 bg-[#0A0A0A]/90 backdrop-blur-sm shadow-2xl will-change-transform"
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
              stroke="#D4AF6A"
              strokeWidth="1.5"
              strokeDasharray="2800"
              strokeDashoffset="2800"
              className="opacity-70"
            />
          </svg>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Logo Emblem Thumbnail */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="relative h-44 w-44 rounded-2xl overflow-hidden border border-[#D4AF6A]/40 shadow-xl bg-black">
                <img
                  src="/assets/logo.png"
                  alt="ICON MUN Crest"
                  className="h-full w-full object-cover scale-110"
                  loading="lazy"
                />
              </div>
              <p className="mt-3 font-cinzel text-xs uppercase tracking-[0.25em] text-[#D4AF6A]">
                Vincit Qui Se Vincit
              </p>
            </div>

            {/* Narrative Prose */}
            <div className="lg:col-span-8 space-y-4">
              <p className="text-sm sm:text-base leading-relaxed text-[#C4BAA8] font-light">
                ICON MUN strips away diplomatic platitudes. In world politics, every state wears a public mask of neutrality, courtesy, and caution.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-[#C4BAA8] font-light">
                Yet inside closed deliberation chambers, decisive global realities are forged by leaders with conviction. Over three rigorous days, delegates navigate real-time intelligence directives and bilateral treaties.
              </p>

              {/* Scrubbed Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-center">
                <div className="space-y-1">
                  <div
                    ref={stat1Ref}
                    className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F3DFA2] font-mono tabular-nums"
                  >
                    0+
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#A89D8A]">
                    Member States
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    ref={stat2Ref}
                    className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F3DFA2] font-mono tabular-nums"
                  >
                    0
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#A89D8A]">
                    Councils
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    ref={stat3Ref}
                    className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F3DFA2] font-mono tabular-nums"
                  >
                    0H
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#A89D8A]">
                    Debate
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    ref={stat4Ref}
                    className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F3DFA2] font-mono tabular-nums"
                  >
                    0%
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#A89D8A]">
                    Immersion
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
