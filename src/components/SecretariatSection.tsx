import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import secGenImg from '../assets/images/secgen_portrait_1792582505295.jpg';
import deputySecGenImg from '../assets/images/deputy_secgen_portrait_1792582506082.jpg';
import usgImg from '../assets/images/usg_portrait_1792582505888.jpg';

gsap.registerPlugin(ScrollTrigger);

interface SecretariatMember {
  name: string;
  role: string;
  image: string;
  quote: string;
  bio: string;
}

const SECRETARIAT_TEAM: SecretariatMember[] = [
  {
    name: 'His Excellency Marcus Vance',
    role: 'Secretary-General',
    image: secGenImg,
    quote: 'True power in diplomacy is not loudest at the podium, but most resolute behind closed doors.',
    bio: 'Former senior advisor at the Geneva Peace Institute; presiding over his eighth international model assembly with emphasis on crisis realism.',
  },
  {
    name: 'Ambassador Elena Rostova',
    role: 'Deputy Secretary-General',
    image: deputySecGenImg,
    quote: 'When the mask of consensus falls, the authentic architecture of statecraft begins.',
    bio: 'Specialist in multilateral treaty law and international trade negotiations; oversees committee substance and resolution jurisprudence.',
  },
  {
    name: 'Julian Sterling, KC',
    role: 'Under-Secretary-General of Crisis Operations',
    image: usgImg,
    quote: 'Every crisis is a crucible: it separates ceremonial delegates from genuine leaders.',
    bio: 'Directs the 24-person Crisis Directorate; architect of real-time multi-theatre intelligence scenarios and emergency directives.',
  },
];

export const SecretariatSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // 1. Portrait SVG rings draw themselves (scrub: 0.5)
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
              scrub: 0.5,
            },
          }
        );
      });

      // 2. Circular portraits scale up from 0.9 to 1 (Transform & Opacity ONLY)
      const portraits = container.querySelectorAll('.secretariat-portrait-img');
      portraits.forEach((img) => {
        gsap.fromTo(
          img,
          { scale: 0.9, opacity: 0.35 },
          {
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: img,
              start: 'top 85%',
              end: 'top 50%',
              scrub: 0.5,
            },
          }
        );
      });

      // 3. Member card subtle rise
      const cards = container.querySelectorAll('.secretariat-col');
      cards.forEach((col) => {
        gsap.fromTo(
          col,
          { opacity: 0.4, y: 30 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: col,
              start: 'top 88%',
              end: 'top 60%',
              scrub: 0.5,
            },
          }
        );
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="secretariat"
      className="relative py-24 px-6 lg:px-12 bg-[#050505] text-[#E6E1D8] overflow-hidden"
    >
      <div className="mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-[#D4AF6A] mb-2">
            <span>Leadership Council</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>Geneva Directorate</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-[0.18em] text-gold-gradient text-balance">
            The High Secretariat
          </h2>
          <p className="mt-2 text-xs uppercase tracking-wider text-[#A89D8A] font-light">
            Guiding international law, procedural excellence, and sovereign integrity.
          </p>
          <div className="mx-auto mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-[#D4AF6A] to-transparent" />
        </div>

        {/* Circular Portraits with Gold Ring Borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SECRETARIAT_TEAM.map((member, idx) => (
            <div
              key={idx}
              className="secretariat-col gold-card group rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center transition-all duration-200 hover:border-[#D4AF6A]/60 bg-[#0C0C0C] will-change-transform"
            >
              {/* Circular Portrait with SVG Ring that draws on scroll */}
              <div className="relative mb-5 h-44 w-44 flex items-center justify-center">
                {/* SVG Ring with Stroke Animation Scrubbed */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="84"
                    fill="none"
                    stroke="#D4AF6A"
                    strokeWidth="2"
                    strokeDasharray="600"
                    strokeDashoffset="600"
                    className="portrait-stroke-ring"
                  />
                </svg>

                {/* Secondary subtle halo */}
                <div className="absolute inset-1 rounded-full border border-dashed border-[#D4AF6A]/20 pointer-events-none" />

                {/* Scaled Circular Image */}
                <div className="relative h-36 w-36 rounded-full overflow-hidden border border-[#D4AF6A]/40 shadow-xl bg-[#111]">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="secretariat-portrait-img h-full w-full object-cover will-change-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Title */}
              <div className="w-full">
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#FFF6D6] mb-1">
                  {member.name}
                </h3>
              </div>

              <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#D4AF6A] mb-3">
                {member.role}
              </p>

              {/* Quote */}
              <blockquote className="text-xs italic text-[#C4BAA8] leading-relaxed mb-3 font-light border-y border-white/5 py-2.5 w-full">
                “{member.quote}”
              </blockquote>

              {/* Bio */}
              <p className="text-[11px] text-[#A89D8A] leading-relaxed font-light">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
