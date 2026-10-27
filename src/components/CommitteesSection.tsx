import React, { useState, useMemo } from 'react';
import { Shield, Eye, Lock, Activity, Landmark, ArrowRight, X } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import type { IconKey } from '../data/defaults';

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
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);

  return (
    <section
      id="committees"
      className="relative w-full py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-transparent text-ink overflow-hidden"
    >
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-gold mb-2">
            <span>Diplomatic Chambers</span>
            <span aria-hidden="true" className="text-golddeep">·</span>
            <span>ICON MUN 2027</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-[0.18em] text-gold-gradient text-balance">
            Councils (TBA)
          </h2>
          <p className="mt-2 text-xs sm:text-sm uppercase tracking-wider text-ink2 font-medium text-contrast">
            All council rosters, topics, and background guides are currently To Be Announced (TBA).
          </p>
          <div className="mx-auto mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>

        {/* Fluid Responsive Council Grid - Continuous Natural Scrolling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
          {COMMITTEES_DATA.map((committee) => (
            <div
              key={committee.id}
              onClick={() => setSelectedCommittee(committee)}
              className="gold-card group relative cursor-pointer rounded-2xl p-7 transition-all duration-300 flex flex-col justify-between border border-gold/30 bg-transparent hover:border-gold hover:scale-[1.02] shadow-[0_0_35px_rgba(0,0,0,0.5)]"
            >
              {/* Top Info */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-black/40 shadow-lg group-hover:border-accent transition-colors">
                      {committee.icon}
                    </div>
                    <div>
                      <span className="font-cinzel text-xl font-bold tracking-widest text-accent text-contrast">
                        {committee.code}
                      </span>
                      <div className="text-[10px] uppercase tracking-wider text-ink2 text-contrast">
                        {committee.seats}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-gold border border-gold/30 bg-black/40 px-2 py-0.5 rounded">
                    TBA
                  </span>
                </div>

                <h3 className="font-cinzel text-base font-semibold text-inkstrong group-hover:text-accent transition-colors mb-2.5 text-contrast">
                  {committee.name}
                </h3>

                <div className="border-t border-ink/15 pt-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-gold block mb-1 text-contrast">
                    Agenda Status
                  </span>
                  <p className="text-xs text-inkstrong leading-relaxed font-normal line-clamp-3 text-contrast">
                    {committee.topic}
                  </p>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="mt-5 border-t border-ink/15 pt-3 flex items-center justify-between">
                <span className="text-xs text-gold font-medium group-hover:text-accent text-contrast">
                  Inspect Dossier (TBA)
                </span>
                <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dossier Modal */}
      {selectedCommittee && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCommittee(null);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="gold-card max-w-2xl w-full rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-gold/60 bg-[#0C0C0C] relative shadow-[0_20px_80px_rgba(0,0,0,0.85)]"
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
                  <span className="font-cinzel text-2xl font-bold text-accent">
                    {selectedCommittee.code}
                  </span>
                  <span className="text-xs text-ink4">·</span>
                  <span className="text-xs uppercase tracking-wider text-gold">
                    {selectedCommittee.level}
                  </span>
                </div>
                <h3 className="font-cinzel text-lg font-semibold text-inkstrong">
                  {selectedCommittee.name}
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-ink2 leading-relaxed">
              <div className="rounded-lg border border-gold/20 bg-surface/50 p-4">
                <span className="text-[10px] uppercase tracking-wider text-gold block mb-1 font-semibold">
                  Committee Topic / Agenda (TBA)
                </span>
                <p className="text-inkstrong font-medium">
                  {selectedCommittee.topic}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-gold block mb-1 font-semibold">
                  Mandate & Charter (TBA)
                </span>
                <p className="text-ink3 font-light leading-relaxed">
                  {selectedCommittee.charter}
                </p>
              </div>

              {selectedCommittee.backgroundGuideOverview && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold block mb-1 font-semibold">
                    Background Guide Preview
                  </span>
                  <p className="text-ink3 font-light leading-relaxed">
                    {selectedCommittee.backgroundGuideOverview}
                  </p>
                </div>
              )}

              {selectedCommittee.focusQuestions && selectedCommittee.focusQuestions.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold block mb-2 font-semibold">
                    Key Debate Focus Areas
                  </span>
                  <ul className="space-y-1.5 pl-4 list-disc text-ink3 text-xs">
                    {selectedCommittee.focusQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-ink/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <span className="text-xs text-ink4">
                Registration opening soon for all delegates.
              </span>
              {onSelectCommitteeForRegister && (
                <button
                  type="button"
                  onClick={() => {
                    const code = selectedCommittee.code;
                    setSelectedCommittee(null);
                    onSelectCommitteeForRegister(code);
                  }}
                  className="gold-btn-primary w-full sm:w-auto px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
                >
                  Register Interest for {selectedCommittee.code}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
