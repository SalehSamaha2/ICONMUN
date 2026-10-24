import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserCheck, Sparkles } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';

gsap.registerPlugin(ScrollTrigger);

export const SecretariatSection: React.FC = () => {
  const { secretariat: SECRETARIAT_TEAM } = useSiteData();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // 1. Portrait SVG rings draw themselves (smooth scrub)
      const rings = container.querySelectorAll('.portrait-stroke-ring');
      rings.forEach((ring) => {
        gsap.fromTo(
          ring,
          { strokeDashoffset: 600 },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: ring,
              start: 'top 85%',
              end: 'top 50%',
              scrub: 0.8,
            },
          }
        );
      });

      // 2. Circular portraits scale up smoothly
      const portraits = container.querySelectorAll('.secretariat-portrait-container');
      portraits.forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0.88, opacity: 0.4 },
          {
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              end: 'top 50%',
              scrub: 0.8,
            },
          }
        );
      });

      // 3. Member card subtle rise
      const cards = container.querySelectorAll('.secretariat-col');
      cards.forEach((col) => {
        gsap.fromTo(
          col,
          { opacity: 0.3, y: 30 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: col,
              start: 'top 88%',
              end: 'top 60%',
              scrub: 0.8,
            },
          }
        );
      });
    }, container);

    return () => ctx.revert();
  }, [SECRETARIAT_TEAM]);

  return (
    <section
      ref={containerRef}
      id="secretariat"
      className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#050505] text-[#E6E1D8] overflow-hidden"
    >
      <div className="mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-[#D4AF6A] mb-2">
            <span>Leadership Council</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>ICON MUN 2027</span>
          </div>
          <h2 className="font-cinzel text-[clamp(1.75rem,5vw,3rem)] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-gold-gradient text-balance">
            The High Secretariat
          </h2>
          <p className="mt-2 text-xs uppercase tracking-wider text-[#A89D8A] font-light">
            Guiding diplomatic integrity, procedural excellence, and memorable assembly.
          </p>
          <div className="mx-auto mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-[#D4AF6A] to-transparent" />
        </div>

        {/* Circular Portraits with Gold Ring Borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {SECRETARIAT_TEAM.map((member, idx) => (
            <div
              key={member.id}
              className={`secretariat-col gold-card group rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center transition-all duration-300 hover:border-[#D4AF6A]/70 bg-[#0C0C0C] will-change-transform ${
                member.isConfirmed ? 'border-[#D4AF6A]/50 shadow-[0_0_30px_rgba(212,175,106,0.12)]' : 'border-white/10'
              }`}
            >
              {/* Circular Portrait with SVG Ring that draws on scroll */}
              <div className="secretariat-portrait-container relative mb-5 h-44 w-44 flex items-center justify-center will-change-transform">
                {/* SVG Ring with Stroke Animation Scrubbed */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="84"
                    fill="none"
                    stroke={member.isConfirmed ? '#D4AF6A' : 'rgba(212, 175, 106, 0.4)'}
                    strokeWidth="2"
                    strokeDasharray="600"
                    strokeDashoffset="600"
                    className="portrait-stroke-ring"
                  />
                </svg>

                {/* Secondary subtle halo */}
                <div className="absolute inset-1 rounded-full border border-dashed border-[#D4AF6A]/20 pointer-events-none" />

                {/* Circular Image or TBA Placeholder */}
                <div className="relative h-36 w-36 rounded-full overflow-hidden border border-[#D4AF6A]/40 shadow-xl bg-[#111] flex items-center justify-center">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      style={{ objectPosition: member.objectPosition || 'center' }}
                      className="h-full w-full object-cover scale-105 transition-transform duration-500 group-hover:scale-110 will-change-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#D4AF6A]/60 p-4">
                      <UserCheck className="h-10 w-10 text-[#D4AF6A]/40 mb-1" />
                      <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF6A]">
                        TBA
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>

                {member.isConfirmed && (
                  <div className="absolute bottom-1 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF6A] bg-[#0A0A0A] shadow-md text-[#F3DFA2]">
                    <Sparkles className="h-3.5 w-3.5 text-[#D4AF6A]" />
                  </div>
                )}
              </div>

              {/* Title & Name */}
              <div className="w-full">
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#FFF6D6] mb-1">
                  {member.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#D4AF6A]">
                  {member.role}
                </p>
                {member.isConfirmed ? (
                  <span className="rounded border border-[#D4AF6A]/40 bg-[#D4AF6A]/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#F3DFA2]">
                    Confirmed
                  </span>
                ) : (
                  <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#A89D8A]">
                    TBA
                  </span>
                )}
              </div>

              {/* Quote */}
              <blockquote className="text-xs italic text-[#C4BAA8] leading-relaxed mb-3 font-light border-y border-white/5 py-2.5 w-full">
                “{member.quote}”
              </blockquote>

              {/* Bio */}
              <p className="text-[11px] text-[#A89D8A] leading-relaxed font-light mt-auto">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
