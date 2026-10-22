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
    id: 'council-1',
    code: 'Council I',
    name: 'Council I (TBA)',
    icon: <Shield className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Topic TBA — Under Secretariat Review',
    level: 'TBA',
    seats: 'Seats TBA',
    charter: 'Council charter and mandate to be announced by the Secretariat.',
    focusQuestions: [
      'Inquiries and research directives TBA.',
      'Discussion prompts TBA.',
    ],
    keyCountries: ['Allotments TBA'],
    backgroundGuideOverview:
      'The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.',
  },
  {
    id: 'council-2',
    code: 'Council II',
    name: 'Council II (TBA)',
    icon: <Eye className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Topic TBA — Under Secretariat Review',
    level: 'TBA',
    seats: 'Seats TBA',
    charter: 'Council charter and mandate to be announced by the Secretariat.',
    focusQuestions: [
      'Inquiries and research directives TBA.',
      'Discussion prompts TBA.',
    ],
    keyCountries: ['Allotments TBA'],
    backgroundGuideOverview:
      'The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.',
  },
  {
    id: 'council-3',
    code: 'Council III',
    name: 'Council III (TBA)',
    icon: <Lock className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Topic TBA — Under Secretariat Review',
    level: 'TBA',
    seats: 'Seats TBA',
    charter: 'Council charter and mandate to be announced by the Secretariat.',
    focusQuestions: [
      'Inquiries and research directives TBA.',
      'Discussion prompts TBA.',
    ],
    keyCountries: ['Allotments TBA'],
    backgroundGuideOverview:
      'The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.',
  },
  {
    id: 'council-4',
    code: 'Council IV',
    name: 'Council IV (TBA)',
    icon: <Activity className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Topic TBA — Under Secretariat Review',
    level: 'TBA',
    seats: 'Seats TBA',
    charter: 'Council charter and mandate to be announced by the Secretariat.',
    focusQuestions: [
      'Inquiries and research directives TBA.',
      'Discussion prompts TBA.',
    ],
    keyCountries: ['Allotments TBA'],
    backgroundGuideOverview:
      'The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.',
  },
  {
    id: 'council-5',
    code: 'Council V',
    name: 'Council V (TBA)',
    icon: <Landmark className="h-7 w-7 text-[#D4AF6A]" />,
    topic: 'Topic TBA — Under Secretariat Review',
    level: 'TBA',
    seats: 'Seats TBA',
    charter: 'Council charter and mandate to be announced by the Secretariat.',
    focusQuestions: [
      'Inquiries and research directives TBA.',
      'Discussion prompts TBA.',
    ],
    keyCountries: ['Allotments TBA'],
    backgroundGuideOverview:
      'The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.',
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
  const activeLabelRef = useRef<HTMLSpanElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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
        const totalShiftPercent = -(totalCards - 1) * 22;

        gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.8,
            pin: sticky,
            pinSpacing: true,
            onUpdate: (self) => {
              const p = self.progress;
              const idx = Math.min(
                Math.floor(p * totalCards),
                totalCards - 1
              );

              // Update progress bar using transform ONLY
              if (progressBarRef.current) {
                progressBarRef.current.style.transform = `scaleX(${Math.max(0.05, p)})`;
              }

              // Update label without triggering React state re-render
              if (activeLabelRef.current && COMMITTEES_DATA[idx]) {
                activeLabelRef.current.innerText = `${COMMITTEES_DATA[idx].code} · Topic TBA`;
              }

              // Card nearest to center scales up to 1.04 and brightens
              cardRefs.current.forEach((cEl, i) => {
                if (!cEl) return;
                const isCenter = i === idx;
                cEl.style.transform = isCenter ? 'scale(1.04)' : 'scale(0.96)';
                cEl.style.opacity = isCenter ? '1' : '0.65';
              });
            },
          },
        }).to(track, {
          xPercent: totalShiftPercent,
          ease: 'none',
        });
      } else {
        // Mobile: Vertical stack, no pinning
        cardRefs.current.forEach((card) => {
          if (!card) return;
          gsap.fromTo(
            card,
            { opacity: 0.35, y: 25 },
            {
              opacity: 1,
              y: 0,
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                end: 'top 55%',
                scrub: 0.8,
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
        className="md:sticky md:top-0 md:h-screen w-full flex flex-col justify-between py-10 md:py-14 px-4 sm:px-6 lg:px-12 md:overflow-hidden"
      >
        {/* Section Header */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-[#D4AF6A] mb-2">
            <span>Diplomatic Chambers</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>ICON MUN 2027</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-[0.18em] text-gold-gradient text-balance">
            Councils (TBA)
          </h2>
          <p className="mt-2 text-xs uppercase tracking-wider text-[#A89D8A] font-light">
            All council rosters, topics, and background guides are currently To Be Announced (TBA).
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
                className="gold-card group relative cursor-pointer rounded-2xl p-7 transition-all duration-300 w-full md:w-[400px] flex-shrink-0 flex flex-col justify-between border-[#D4AF6A]/30 bg-[#0C0C0C] will-change-transform"
                style={{
                  transform: idx === 0 ? 'scale(1.04)' : 'scale(0.96)',
                  opacity: idx === 0 ? 1 : 0.7,
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
                      TBA
                    </span>
                  </div>

                  <h3 className="font-cinzel text-base font-semibold text-white group-hover:text-[#F3DFA2] transition-colors mb-2.5">
                    {committee.name}
                  </h3>

                  <div className="border-t border-white/10 pt-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF6A] block mb-1">
                      Agenda Status
                    </span>
                    <p className="text-xs text-[#C4BAA8] leading-relaxed font-light line-clamp-3">
                      {committee.topic}
                    </p>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between">
                  <span className="text-xs text-[#D4AF6A] font-medium group-hover:text-[#F3DFA2]">
                    Inspect Dossier (TBA)
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
            <span>Chambers 01 — 05</span>
            <span ref={activeLabelRef} className="text-[#D4AF6A]">
              Council I · Topic TBA
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
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCommittee(null);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="gold-card max-w-2xl w-full rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border-[#D4AF6A]/60 bg-[#0C0C0C] relative shadow-[0_0_80px_rgba(0,0,0,0.98)]"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedCommittee(null);
              }}
              className="absolute top-4 right-4 z-50 h-11 w-11 flex items-center justify-center rounded-full bg-[#181818] border border-[#D4AF6A]/50 text-[#F3DFA2] hover:text-white hover:bg-[#252525] hover:border-[#D4AF6A] transition-all cursor-pointer active:scale-90 shadow-xl"
              aria-label="Close dossier modal"
            >
              <X className="h-5 w-5 pointer-events-none" />
            </button>

            <div className="flex items-start gap-4 mb-6 pr-10">
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
                Agenda Topic
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
                Inquiries & Position Paper Directives
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedCommittee(null);
                }}
                className="min-h-[44px] px-4 py-2.5 text-xs uppercase tracking-wider text-[#A89D8A] hover:text-white cursor-pointer active:scale-95 flex items-center justify-center"
              >
                Close Dossier
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = selectedCommittee.code;
                  setSelectedCommittee(null);
                  if (onSelectCommitteeForRegister) {
                    onSelectCommitteeForRegister(code);
                  }
                }}
                className="gold-btn-primary min-h-[44px] px-6 py-3 text-xs font-semibold uppercase tracking-wider rounded cursor-pointer active:scale-95 flex items-center justify-center"
              >
                Register Interest (TBA)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
