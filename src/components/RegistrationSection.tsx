import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Award, CheckCircle2, X } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface RegistrationSectionProps {
  isOpenModal: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
  preselectedCommittee?: string;
}

export const RegistrationSection: React.FC<RegistrationSectionProps> = ({
  isOpenModal,
  onCloseModal,
  onOpenModal,
  preselectedCommittee = 'UNSC',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const bgGlobeRef = useRef<SVGSVGElement | null>(null);
  const buttonWrapperRef = useRef<HTMLDivElement | null>(null);

  // Form states
  const [delegationType, setDelegationType] = useState<'single' | 'double' | 'head'>('single');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [committee, setCommittee] = useState(preselectedCommittee);
  const [firstCountry, setFirstCountry] = useState('Switzerland');
  const [experienceLevel, setExperienceLevel] = useState('Experienced (3+ MUNs)');
  const [statement, setStatement] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const ctx = gsap.context(() => {
      // Pinned ~120vh, scrub: 0.5, master timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          pin: sticky,
          pinSpacing: true,
        },
      });

      // 1. Giant globe and laurel rotate and scale behind (transform & opacity only)
      if (bgGlobeRef.current) {
        tl.fromTo(
          bgGlobeRef.current,
          { scale: 0.8, rotate: -25, opacity: 0.04 },
          { scale: 1.25, rotate: 25, opacity: 0.15, ease: 'none' },
          0
        );
      }

      // 2. Headline scales up from small to full size (transform & opacity only - NO BLUR)
      if (headlineRef.current) {
        tl.fromTo(
          headlineRef.current,
          { scale: 0.65, opacity: 0.2 },
          { scale: 1, opacity: 1, ease: 'power2.out' },
          0.05
        );
      }

      // 3. Register Now button fades in at end of scrub
      if (buttonWrapperRef.current) {
        tl.fromTo(
          buttonWrapperRef.current,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, ease: 'power2.out' },
          0.4
        );
      }
    }, container);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onCloseModal();
  };

  return (
    <>
      <div
        ref={containerRef}
        id="registration"
        className="relative w-full bg-[#050505] h-[120vh]"
      >
        {/* Pinned Viewport Container (120vh) */}
        <div
          ref={stickyRef}
          className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-6 lg:px-12"
        >
          {/* Rotating Giant Globe & Laurel behind (Single static SVG rotating via GSAP) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <svg
              ref={bgGlobeRef}
              viewBox="0 0 1000 1000"
              className="w-[850px] h-[850px] text-[#D4AF6A] will-change-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <circle cx="500" cy="500" r="420" strokeDasharray="10 10" />
              <circle cx="500" cy="500" r="320" />
              <circle cx="500" cy="500" r="220" strokeDasharray="6 6" />
              <circle cx="500" cy="500" r="120" />
              {[0, 30, 60, 90, 120, 150].map((deg) => (
                <line
                  key={deg}
                  x1="500"
                  y1="80"
                  x2="500"
                  y2="920"
                  transform={`rotate(${deg} 500 500)`}
                  opacity="0.4"
                />
              ))}
              {Array.from({ length: 32 }).map((_, i) => {
                const rot = i * (360 / 32);
                return (
                  <path
                    key={i}
                    d="M 500 60 C 485 30, 515 30, 500 0 C 485 30, 515 30, 500 60"
                    transform={`rotate(${rot} 500 500)`}
                    fill="currentColor"
                    opacity="0.75"
                  />
                );
              })}
            </svg>
          </div>

          {/* Central Registration Presentation */}
          <div className="relative z-10 max-w-4xl w-full text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF6A]/30 bg-[#D4AF6A]/10 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-[#F3DFA2] mb-6">
              <Award className="h-4 w-4 text-[#D4AF6A]" />
              <span>Geneva Accreditations Open · 2026</span>
            </div>

            {/* Headline scaling from small to full size */}
            <h2
              ref={headlineRef}
              className="font-cinzel text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-[0.16em] text-gold-shimmer will-change-transform text-balance"
              style={{
                textShadow: '0 0 35px rgba(212, 175, 106, 0.4), 0 0 70px rgba(90, 15, 30, 0.25)',
              }}
            >
              Take Off Your Mask.
              <br />
              <span className="text-white">Take the Floor.</span>
            </h2>

            <p className="mt-5 text-xs sm:text-sm text-[#C4BAA8] max-w-lg mx-auto font-light leading-relaxed">
              Step into the chambers where the world’s most intractable geopolitical crises are dissected. Limited seats remain across our five sovereign councils.
            </p>

            {/* Action Button fading in at end of scrub */}
            <div
              ref={buttonWrapperRef}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 will-change-transform"
            >
              <button
                onClick={onOpenModal}
                className="gold-btn-primary px-9 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] rounded-md shadow-2xl hover:scale-105 transition-all cursor-pointer"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Credential Application Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="gold-card max-w-3xl w-full rounded-2xl p-6 sm:p-10 max-h-[92vh] overflow-y-auto border-[#D4AF6A]/50 bg-[#0C0C0C] relative shadow-[0_0_60px_rgba(0,0,0,0.95)]">
            <button
              onClick={onCloseModal}
              className="absolute top-6 right-6 p-1.5 text-[#A89D8A] hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {!isSubmitted ? (
              <>
                <div className="mb-6">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF6A] mb-1 font-medium">
                    Official Application Portal
                  </div>
                  <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient">
                    Diplomatic Credential Application
                  </h3>
                  <p className="text-xs text-[#A89D8A] mt-1">
                    Submit your credentials to the High Secretariat for council allotment.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-2 font-medium">
                      Delegation Status
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['single', 'double', 'head'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDelegationType(type)}
                          className={`rounded-lg p-2.5 text-xs uppercase tracking-wider font-medium border transition-all text-center cursor-pointer ${
                            delegationType === type
                              ? 'border-[#D4AF6A] bg-[#D4AF6A]/15 text-[#FFF3D6]'
                              : 'border-white/10 bg-[#141414] text-[#A89D8A] hover:bg-[#1a1a1a]'
                          }`}
                        >
                          {type === 'single' && 'Single Delegate'}
                          {type === 'double' && 'Double Delegation'}
                          {type === 'head' && 'Head of Delegation'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Full Name / Diplomatic Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Lord Alexander Wright"
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Institution / University / Embassy *
                      </label>
                      <input
                        type="text"
                        required
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. Geneva School of Diplomacy"
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Official Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="delegate@diplomacy.org"
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Primary Council Preference
                      </label>
                      <select
                        value={committee}
                        onChange={(e) => setCommittee(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white focus:border-[#D4AF6A] focus:outline-none"
                      >
                        <option value="UNSC">UNSC — United Nations Security Council</option>
                        <option value="UNHRC">UNHRC — Human Rights Council</option>
                        <option value="DISEC">DISEC — Disarmament & International Security</option>
                        <option value="WHO">WHO — World Health Organization Assembly</option>
                        <option value="ECOSOC">ECOSOC — Economic & Social Council</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        First Country Preference
                      </label>
                      <input
                        type="text"
                        value={firstCountry}
                        onChange={(e) => setFirstCountry(e.target.value)}
                        placeholder="e.g. United Kingdom, France, Brazil"
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Delegate Experience Level
                      </label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white focus:border-[#D4AF6A] focus:outline-none"
                      >
                        <option value="Novice (First MUN)">Novice (First MUN)</option>
                        <option value="Intermediate (1-2 MUNs)">Intermediate (1-2 MUNs)</option>
                        <option value="Experienced (3+ MUNs)">Experienced (3+ MUNs)</option>
                        <option value="Veteran / Crisis Specialist">Veteran / Crisis Specialist</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                      Diplomatic Statement & Policy Focus (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      placeholder="Outline your strategic priorities..."
                      className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onCloseModal}
                      className="px-5 py-2.5 text-xs uppercase tracking-wider text-[#A89D8A] hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="gold-btn-primary px-8 py-3 text-xs font-bold uppercase tracking-widest rounded cursor-pointer"
                    >
                      Submit Credential Dossier
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF6A] bg-[#D4AF6A]/10 text-[#F3DFA2] shadow-[0_0_20px_rgba(212,175,106,0.3)]">
                  <CheckCircle2 className="h-8 w-8 text-[#D4AF6A]" />
                </div>

                <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-shimmer mb-2">
                  Dossier Formally Deposited
                </h3>
                <p className="text-xs text-[#C4BAA8] max-w-md mx-auto mb-8 font-light">
                  Your credentials have been submitted to the High Secretariat. Below is your provisional delegate pass:
                </p>

                <div className="max-w-md mx-auto rounded-2xl border-2 border-[#D4AF6A] bg-gradient-to-b from-[#161616] to-[#0A0A0A] p-6 text-left relative shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#8C6221] via-[#D4AF6A] to-[#FFF3D6]" />
                  <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                    <div>
                      <div className="font-cinzel text-lg font-bold text-[#F3DFA2]">
                        ICON MUN 2026
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-[#D4AF6A]">
                        Provisional Diplomatic Pass
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-[#D4AF6A]">#ICN-8829</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/50">Geneva Accreditations</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#A89D8A] block">
                        Delegate Name
                      </span>
                      <span className="font-medium text-sm text-white">
                        {fullName || 'Ambassador Delegate'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#A89D8A] block">
                          Council Assigned
                        </span>
                        <span className="font-medium text-xs text-[#F3DFA2]">
                          {committee}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#A89D8A] block">
                          Requested Country
                        </span>
                        <span className="font-medium text-xs text-[#F3DFA2]">
                          {firstCountry}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-[#A89D8A]">
                    <span>Status: Provisional Review</span>
                    <span className="font-mono text-[#D4AF6A]">SECRETARIAT SEALED</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={handleReset}
                    className="gold-btn-primary px-6 py-2 text-xs font-semibold uppercase tracking-wider rounded cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
