import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Eye, Lock, Activity, Landmark, ArrowRight, X, FileText } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Committee {
  id: string;
  code: string;
  name: string;
  icon: React.ReactNode;
  topic: string;
  level: string;
  seats: string;
  charter: string;
  focusQuestions: string[];
  keyCountries: string[];
  backgroundGuideOverview: string;
}

const COMMITTEES_DATA: Committee[] = [
  {
    id: 'unsc',
    code: 'UNSC',
    name: 'United Nations Security Council',
    icon: <Shield className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Flashpoint Maritime Chokepoints & Sovereign Neutrality Enforcement',
    level: 'Advanced / Crisis Mandate',
    seats: '15 Delegations',
    charter: 'Article 39, UN Charter · Primary responsibility for the maintenance of international peace and security.',
    focusQuestions: [
      'How can multilateral naval inspection regimes balance commercial freedom of navigation with unilateral coastal defense declarations?',
      'What binding sanctions thresholds prevent escalation without triggering asymmetric trade blockades?',
      'Can permanent member vetoes be curtailed in instances of clear maritime sabotage?',
    ],
    keyCountries: ['United States', 'China', 'Russia', 'United Kingdom', 'France', 'Japan'],
    backgroundGuideOverview:
      'The Security Council convenes under emergency procedural rule 48. Tensions along critical naval straits threaten 38% of global container transit. Delegates must navigate real-time crisis directives issued by the joint command.',
  },
  {
    id: 'unhrc',
    code: 'UNHRC',
    name: 'Human Rights Council',
    icon: <Eye className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Biometric Border Interception & Privacy in Unregistered Enclaves',
    level: 'Intermediate / Policy Heavy',
    seats: '36 Delegations',
    charter: 'UNGA Resolution 60/251 · Strengthening the promotion and protection of human rights worldwide.',
    focusQuestions: [
      'Where lies the legal threshold between sovereign border telemetry and human dignity under Article 14 of the UDHR?',
      'Can non-state surveillance contractors be held accountable under universal jurisdiction protocols?',
      'How can humanitarian aid corridors remain inviolable when digital tracking systems are deployed?',
    ],
    keyCountries: ['Germany', 'Brazil', 'South Africa', 'India', 'Canada', 'Mexico'],
    backgroundGuideOverview:
      'As sovereign boundaries increasingly deploy facial recognition algorithms and automated perimeter drones, refugees and asylum seekers face algorithmic denial of entry. The Council must codify the Geneva Protocol on Biometric Privacy.',
  },
  {
    id: 'disec',
    code: 'DISEC',
    name: 'Disarmament & International Security (GA 1)',
    icon: <Lock className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Weaponization of Autonomous Cyber Vectors & Orbital ASAT Systems',
    level: 'Intermediate / High Resolution Volume',
    seats: '45 Delegations',
    charter: 'Article 11, UN Charter · General principles of cooperation in the maintenance of international peace and disarmament.',
    focusQuestions: [
      'What verification mechanisms can differentiate civilian satellite maintenance bots from dual-use orbital interceptors?',
      'How to establish deterrence without triggering pre-emptive retaliatory kinetic strikes in low-earth orbit?',
      'Should sovereign state attribution be mandatory before triggering mutual cyber-defense covenants?',
    ],
    keyCountries: ['United States', 'Israel', 'South Korea', 'Iran', 'Turkey', 'Norway'],
    backgroundGuideOverview:
      'With the outer space treaty nearing six decades of obsolescence, DISEC faces the reality of silent space warfare. Delegates will draft comprehensive treaties to regulate autonomous satellite constellations.',
  },
  {
    id: 'who',
    code: 'WHO',
    name: 'World Health Organization Special Assembly',
    icon: <Activity className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Containment of Synthetic Bio-Threats & Genomic Intellectual Property',
    level: 'Intermediate / Dynamic Pacing',
    seats: '32 Delegations',
    charter: 'Constitution of the WHO · Attainment by all peoples of the highest possible level of health.',
    focusQuestions: [
      'How can the Pandemic Accord compel transparent genomic sequencing sharing without compromising national biosecurity?',
      'What intellectual property waivers must take immediate effect during grade-4 regional epidemiological emergencies?',
      'Can international sanitary cordons be enforced without violating sovereign airspace treaties?',
    ],
    keyCountries: ['Switzerland', 'Australia', 'Nigeria', 'Sweden', 'Argentina', 'Egypt'],
    backgroundGuideOverview:
      'A novel recombinant respiratory pathogen with synthetic markers emerges simultaneously in three international transit hubs. The WHO must coordinate quarantine protocols and emergency vaccine stockpiles.',
  },
  {
    id: 'ecosoc',
    code: 'ECOSOC',
    name: 'Economic & Social Council',
    icon: <Landmark className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Sovereign Debt Default Cascades & Critical Mineral Cartelization',
    level: 'Advanced / Bilateral Diplomacy',
    seats: '38 Delegations',
    charter: 'Chapter X, UN Charter · Fostering international economic, social, cultural, and health cooperation.',
    focusQuestions: [
      'How can multilateral development banks prevent systemic contagion when multiple sovereign states default simultaneously?',
      'What regulatory frameworks counter predatory rare-earth mineral cartels without stifling energy transition investments?',
      'Can digital reserve assets provide stability against currency hyper-inflation in vulnerable developing markets?',
    ],
    keyCountries: ['Saudi Arabia', 'Chile', 'Indonesia', 'DR Congo', 'United Kingdom', 'Germany'],
    backgroundGuideOverview:
      'Global liquidity crunches collide with sudden export bans on lithium, cobalt, and neodymium. ECOSOC delegates will craft economic restructuring agreements and green trade protocols.',
  },
];

interface CommitteesSectionProps {
  onSelectCommitteeForRegister?: (code: string) => void;
}

export const CommitteesSection: React.FC<CommitteesSectionProps> = ({
  onSelectCommitteeForRegister,
}) => {
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const horizontalTrackRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    const track = horizontalTrackRef.current;
    if (!container || !sticky || !track) return;

    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      if (!isMobile) {
        // Desktop: Pin for ~150vh and convert vertical scroll into horizontal movement
        const totalCards = COMMITTEES_DATA.length;
        // Move track across screen
        const totalShiftPercent = -(totalCards - 1) * 22;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5, // short smoothing
            pin: sticky,
            pinSpacing: true,
            onUpdate: (self) => {
              const p = self.progress;
              const idx = Math.min(
                Math.floor(p * totalCards),
                totalCards - 1
              );

              if (activeIndexRef.current !== idx) {
                activeIndexRef.current = idx;
                setActiveIndex(idx);
              }

              // Update progress bar using transform ONLY
              if (progressBarRef.current) {
                progressBarRef.current.style.transform = `scaleX(${Math.max(0.05, p)})`;
              }

              // Card nearest to center scales up to 1.05 and brightens, others dim
              cardRefs.current.forEach((cEl, i) => {
                if (!cEl) return;
                const isCenter = i === idx;
                cEl.style.transform = isCenter ? 'scale(1.04)' : 'scale(0.96)';
                cEl.style.opacity = isCenter ? '1' : '0.65';
              });
            },
          },
        });

        // Horizontal card track translation
        tl.to(track, {
          xPercent: totalShiftPercent,
          ease: 'none',
        });
      } else {
        // Mobile: Vertical stack, no pinning, simple entrance
        cardRefs.current.forEach((card) => {
          if (!card) return;
          gsap.fromTo(
            card,
            { opacity: 0.4, y: 25 },
            {
              opacity: 1,
              y: 0,
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                end: 'top 55%',
                scrub: 0.5,
              },
            }
          );
        });
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="committees"
      className="relative w-full bg-[#050505] md:h-[150vh]"
    >
      {/* Pinned Viewport Container (Desktop ~150vh, Mobile natural flow) */}
      <div
        ref={stickyRef}
        className="md:sticky md:top-0 md:h-screen w-full flex flex-col justify-between py-10 md:py-14 overflow-hidden px-6 lg:px-12"
      >
        {/* Section Header */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-[#D4AF6A] mb-2">
            <span>Diplomatic Chambers</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>2026 Simulation Matrix</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-[0.18em] text-gold-gradient text-balance">
            Five Councils of Power
          </h2>
          <p className="mt-2 text-xs uppercase tracking-wider text-[#A89D8A] font-light">
            Scroll through the sovereign chambers to inspect the classified dossiers.
          </p>
        </div>

        {/* Horizontal Track of Cards (Desktop) / Vertical Stack (Mobile) */}
        <div className="relative z-10 flex-1 flex items-center overflow-visible">
          <div
            ref={horizontalTrackRef}
            className="flex flex-col md:flex-row items-stretch gap-6 md:gap-8 will-change-transform w-full md:w-max md:pl-[12vw]"
          >
            {COMMITTEES_DATA.map((committee, idx) => (
              <div
                key={committee.id}
                ref={(el) => { cardRefs.current[idx] = el; }}
                onClick={() => setSelectedCommittee(committee)}
                className="gold-card group relative cursor-pointer rounded-2xl p-7 transition-all duration-200 w-full md:w-[400px] flex-shrink-0 flex flex-col justify-between border-[#D4AF6A]/30 bg-[#0C0C0C] will-change-transform"
                style={{
                  transform: idx === activeIndex ? 'scale(1.04)' : 'scale(0.96)',
                  opacity: idx === activeIndex ? 1 : 0.7,
                }}
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF6A]/40 bg-[#141414] shadow-lg group-hover:border-[#F3DFA2] transition-colors">
                        {committee.icon}
                      </div>
                      <div>
                        <span className="font-cinzel text-xl font-bold tracking-widest text-[#F3DFA2]">
                          {committee.code}
                        </span>
                        <div className="text-[10px] uppercase tracking-wider text-[#A89D8A]">
                          {committee.seats}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF6A] border border-[#D4AF6A]/20 bg-[#D4AF6A]/10 px-2 py-0.5 rounded">
                      {committee.level.split('/')[0].trim()}
                    </span>
                  </div>

                  <h3 className="font-cinzel text-base font-semibold text-white group-hover:text-[#F3DFA2] transition-colors mb-2.5">
                    {committee.name}
                  </h3>

                  <div className="border-t border-white/10 pt-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF6A] block mb-1">
                      Primary Agenda Topic
                    </span>
                    <p className="text-xs text-[#C4BAA8] leading-relaxed font-light line-clamp-3">
                      {committee.topic}
                    </p>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between">
                  <span className="text-xs text-[#D4AF6A] font-medium group-hover:text-[#F3DFA2]">
                    Inspect Dossier
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#D4AF6A] transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Horizontal Progress Indicator (Desktop only) */}
        <div className="relative z-10 hidden md:block max-w-md mx-auto w-full pt-2">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#A89D8A] mb-1 font-mono">
            <span>Chamber 0{activeIndex + 1} / 05</span>
            <span className="text-[#D4AF6A]">
              {COMMITTEES_DATA[activeIndex]?.code} Active
            </span>
          </div>
          <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-[#8C6221] via-[#D4AF6A] to-[#FFF3D6] origin-left will-change-transform"
              style={{ transform: 'scaleX(0.2)' }}
            />
          </div>
        </div>
      </div>

      {/* Committee Dossier Modal */}
      {selectedCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="gold-card max-w-2xl w-full rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border-[#D4AF6A]/60 bg-[#0C0C0C] relative shadow-[0_0_60px_rgba(0,0,0,0.95)]">
            <button
              onClick={() => setSelectedCommittee(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A89D8A] hover:text-white cursor-pointer"
              aria-label="Close dossier"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4 mb-6 pr-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D4AF6A] bg-[#141414] shadow-lg">
                {selectedCommittee.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-xl sm:text-2xl font-bold text-gold-gradient">
                    {selectedCommittee.code}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-[#A89D8A]">
                    · {selectedCommittee.seats}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-medium text-[#E6E1D8]">
                  {selectedCommittee.name}
                </h3>
              </div>
            </div>

            <div className="rounded-xl border border-[#D4AF6A]/30 bg-[#141414] p-4 mb-5">
              <span className="text-[10px] uppercase tracking-wider text-[#D4AF6A] block mb-1">
                Primary Agenda Topic
              </span>
              <p className="font-cinzel text-base sm:text-lg text-[#FFF3D6] font-medium leading-snug">
                {selectedCommittee.topic}
              </p>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#C4BAA8] leading-relaxed mb-5 font-light">
              <p>{selectedCommittee.backgroundGuideOverview}</p>
              <p className="italic text-[#A89D8A] border-l border-[#D4AF6A]/40 pl-3">
                {selectedCommittee.charter}
              </p>
            </div>

            <div className="mb-5">
              <h4 className="font-cinzel text-xs uppercase tracking-widest text-[#F3DFA2] mb-2 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#D4AF6A]" />
                Key Inquiries for Position Papers
              </h4>
              <ul className="space-y-1.5 text-xs text-[#A89D8A]">
                {selectedCommittee.focusQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#D4AF6A] font-mono">0{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6 border-t border-white/10 pt-3">
              <span className="text-[10px] uppercase tracking-wider text-[#A89D8A] block mb-2">
                Sample Sovereign Portfolios
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedCommittee.keyCountries.map((country, i) => (
                  <span
                    key={i}
                    className="rounded border border-white/10 bg-[#161616] px-2.5 py-1 text-xs text-[#E6E1D8]"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => setSelectedCommittee(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider text-[#A89D8A] hover:text-white cursor-pointer"
              >
                Close Dossier
              </button>
              <button
                onClick={() => {
                  const code = selectedCommittee.code;
                  setSelectedCommittee(null);
                  if (onSelectCommitteeForRegister) {
                    onSelectCommitteeForRegister(code);
                  }
                }}
                className="gold-btn-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded cursor-pointer"
              >
                Apply For {selectedCommittee.code}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
