import React, { useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Eye, Lock, Activity, Landmark, ArrowRight, X, FileText } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import type { IconKey } from '../data/defaults';

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

const ICONS: Record<IconKey, React.ReactNode> = {
  shield: <Shield className="h-7 w-7 text-gold" />,
  eye: <Eye className="h-7 w-7 text-gold" />,
  lock: <Lock className="h-7 w-7 text-gold" />,
  activity: <Activity className="h-7 w-7 text-gold" />,
  landmark: <Landmark className="h-7 w-7 text-gold" />,
};

interface CommitteesSectionProps {
  onSelectCommitteeForRegister?: (code: string) => void;
}

export const CommitteesSection: React.FC<CommitteesSectionProps> = ({
  onSelectCommitteeForRegister,
}) => {
  const { committees } = useSiteData();
  const COMMITTEES_DATA: Committee[] = useMemo(
    () => committees.map((c) => ({ ...c, icon: ICONS[c.iconKey] ?? ICONS.shield })),
    [committees]
  );
  const committeesRef = useRef<Committee[]>(COMMITTEES_DATA);
  committeesRef.current = COMMITTEES_DATA;
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
        const totalCards = committeesRef.current.length;
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
              const active = committeesRef.current[idx];
              if (activeLabelRef.current && active) {
                activeLabelRef.current.innerText = `${active.code} · ${active.topic.startsWith('Topic TBA') ? 'Topic TBA' : active.topic}`;
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
  }, [COMMITTEES_DATA.length]);

  return (
    <div
      ref={containerRef}
      id="committees"
      className="relative w-full bg-paper md:h-[150vh]"
    >
      {/* Pinned Viewport Container (Desktop ~150vh, Mobile natural flow) */}
      <div
        ref={stickyRef}
        className="md:sticky md:top-0 md:h-screen w-full flex flex-col justify-between py-10 md:py-14 px-4 sm:px-6 lg:px-12 md:overflow-hidden"
      >
        {/* Section Header */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-gold mb-2">
            <span>Diplomatic Chambers</span>
            <span aria-hidden="true" className="text-golddeep">·</span>
            <span>ICON MUN 2027</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-[0.18em] text-gold-gradient text-balance">
            Councils (TBA)
          </h2>
          <p className="mt-2 text-xs uppercase tracking-wider text-ink3 font-light">
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
                className="gold-card group relative cursor-pointer rounded-2xl p-7 transition-all duration-300 w-full md:w-[400px] flex-shrink-0 flex flex-col justify-between border-gold/30 bg-surface will-change-transform"
                style={{
                  transform: idx === 0 ? 'scale(1.04)' : 'scale(0.96)',
                  opacity: idx === 0 ? 1 : 0.7,
                }}
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-surface2 shadow-lg group-hover:border-accent transition-colors">
                        {committee.icon}
                      </div>
                      <div>
                        <span className="font-cinzel text-xl font-bold tracking-widest text-accent">
                          {committee.code}
                        </span>
                        <div className="text-[10px] uppercase tracking-wider text-ink3">
                          {committee.seats}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-gold border border-gold/20 bg-gold/10 px-2 py-0.5 rounded">
                      TBA
                    </span>
                  </div>

                  <h3 className="font-cinzel text-base font-semibold text-inkstrong group-hover:text-accent transition-colors mb-2.5">
                    {committee.name}
                  </h3>

                  <div className="border-t border-ink/10 pt-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-gold block mb-1">
                      Agenda Status
                    </span>
                    <p className="text-xs text-ink2 leading-relaxed font-light line-clamp-3">
                      {committee.topic}
                    </p>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-5 border-t border-ink/10 pt-3 flex items-center justify-between">
                  <span className="text-xs text-gold font-medium group-hover:text-accent">
                    Inspect Dossier (TBA)
                  </span>
                  <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Horizontal Progress Indicator (Desktop only) */}
        <div className="relative z-10 hidden md:block max-w-md mx-auto w-full pt-2">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-ink3 mb-1 font-mono">
            <span>Chambers 01 — 05</span>
            <span ref={activeLabelRef} className="text-gold">
              Council I · Topic TBA
            </span>
          </div>
          <div className="h-[2px] w-full bg-ink/10 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-golddeep via-gold to-inkstrong origin-left will-change-transform"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-overlay backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="gold-card max-w-2xl w-full rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border-gold/60 bg-surface relative shadow-[0_20px_80px_rgba(40,15,15,0.45)]"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedCommittee(null);
              }}
              className="absolute top-4 right-4 z-50 h-11 w-11 flex items-center justify-center rounded-full bg-surface2 border border-gold/50 text-accent hover:text-inkstrong hover:bg-surface2 hover:border-gold transition-all cursor-pointer active:scale-90 shadow-xl"
              aria-label="Close dossier modal"
            >
              <X className="h-5 w-5 pointer-events-none" />
            </button>

            <div className="flex items-start gap-4 mb-6 pr-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold bg-surface2 shadow-lg">
                {selectedCommittee.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-xl sm:text-2xl font-bold text-gold-gradient">
                    {selectedCommittee.code}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-ink3">
                    · {selectedCommittee.seats}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-medium text-ink">
                  {selectedCommittee.name}
                </h3>
              </div>
            </div>

            <div className="rounded-xl border border-gold/30 bg-surface2 p-4 mb-5">
              <span className="text-[10px] uppercase tracking-wider text-gold block mb-1">
                Agenda Topic
              </span>
              <p className="font-cinzel text-base sm:text-lg text-inkstrong font-medium leading-snug">
                {selectedCommittee.topic}
              </p>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-ink2 leading-relaxed mb-5 font-light">
              <p>{selectedCommittee.backgroundGuideOverview}</p>
              <p className="italic text-ink3 border-l border-gold/40 pl-3">
                {selectedCommittee.charter}
              </p>
            </div>

            <div className="mb-5">
              <h4 className="font-cinzel text-xs uppercase tracking-widest text-accent mb-2 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-gold" />
                Inquiries & Position Paper Directives
              </h4>
              <ul className="space-y-1.5 text-xs text-ink3">
                {selectedCommittee.focusQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gold font-mono">0{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-ink/10 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedCommittee(null);
                }}
                className="min-h-[44px] px-4 py-2.5 text-xs uppercase tracking-wider text-ink3 hover:text-inkstrong cursor-pointer active:scale-95 flex items-center justify-center"
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
