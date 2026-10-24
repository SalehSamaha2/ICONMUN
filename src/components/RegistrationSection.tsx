import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Award, CheckCircle2, X } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import { getSupabase } from '../lib/supabase';

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
  preselectedCommittee = 'TBA',
}) => {
  const { committees, settings } = useSiteData();
  const registrationOpen = !['false', 'no', '0', 'closed'].includes((settings.registration_open || 'true').toLowerCase());
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
  const [firstCountry, setFirstCountry] = useState('TBA');
  const [experienceLevel, setExperienceLevel] = useState('TBA');
  const [statement, setStatement] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [honeypot, setHoneypot] = useState(''); // hidden field: real people never fill it

  // Pre-select the council the visitor clicked (matched by code, e.g. "Council II")
  useEffect(() => {
    if (!isOpenModal) return;
    setSubmitError('');
    setCommittee(committees.some((c) => c.code === preselectedCommittee) ? preselectedCommittee : 'TBA');
  }, [isOpenModal, preselectedCommittee, committees]);

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!isOpenModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpenModal, onCloseModal]);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const ctx = gsap.context(() => {
      // Pinned ~120vh, smooth scrub: 0.8
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          pin: sticky,
          pinSpacing: true,
        },
      });

      // 1. Giant globe and laurel rotate and scale behind
      if (bgGlobeRef.current) {
        tl.fromTo(
          bgGlobeRef.current,
          { scale: 0.85, rotate: -20, opacity: 0.04 },
          { scale: 1.25, rotate: 20, opacity: 0.15, ease: 'none' },
          0
        );
      }

      // 2. Headline scales up from small to full size
      if (headlineRef.current) {
        tl.fromTo(
          headlineRef.current,
          { scale: 0.7, opacity: 0.2 },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || !fullName.trim() || !email.trim()) return;
    setSubmitError('');

    // Bots fill hidden fields; pretend success and drop it.
    if (honeypot) {
      setIsSubmitted(true);
      return;
    }

    const clientP = getSupabase();
    if (!clientP) {
      setSubmitError('Registration is not available yet. Please try again later.');
      return;
    }

    setIsSending(true);
    try {
      const sb = await clientP;
      const { error } = await sb.from('applications').insert({
        delegation_type: delegationType,
        full_name: fullName.trim(),
        institution: institution.trim(),
        email: email.trim(),
        committee,
        first_country: firstCountry.trim() || 'TBA',
        experience_level: experienceLevel,
        statement: statement.trim(),
      });
      if (error) {
        const msg = error.message || '';
        if (/closed/i.test(msg)) setSubmitError('Registration is currently closed.');
        else if (/already been used/i.test(msg)) setSubmitError('This email has already been used for several applications.');
        else if (/Too many/i.test(msg)) setSubmitError('We are receiving many applications right now. Please try again in a few minutes.');
        else setSubmitError('Something went wrong. Please check your details and try again.');
        return;
      }
      setIsSubmitted(true);
    } catch {
      setSubmitError('Could not reach the registry. Please check your connection and try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFullName('');
    setInstitution('');
    setEmail('');
    setStatement('');
    onCloseModal();
  };

  return (
    <>
      <div
        ref={containerRef}
        id="registration"
        className="relative w-full bg-[#050505] h-[100vh] md:h-[120vh]"
      >
        {/* Pinned Viewport Container (100dvh) */}
        <div
          ref={stickyRef}
          className="sticky top-0 h-screen-dvh w-full flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-12"
        >
          {/* Rotating Giant Globe & Laurel behind (Hidden on small mobile) */}
          <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none select-none z-0">
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
          <div className="relative z-10 max-w-4xl w-full text-center px-2 sm:px-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF6A]/30 bg-[#D4AF6A]/10 px-3.5 sm:px-4 py-1.5 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#F3DFA2] mb-4 sm:mb-6">
              <Award className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-[#D4AF6A]" />
              <span>ICON MUN 2027 · Registry TBA</span>
            </div>

            {/* Headline scaling from small to full size */}
            <h2
              ref={headlineRef}
              className="font-cinzel text-[clamp(1.85rem,6vw,4.5rem)] font-bold uppercase tracking-[0.14em] sm:tracking-[0.16em] text-gold-shimmer will-change-transform text-balance leading-tight"
              style={{
                textShadow: '0 0 35px rgba(212, 175, 106, 0.4), 0 0 70px rgba(90, 15, 30, 0.25)',
              }}
            >
              Take Off Your Mask.
              <br />
              <span className="text-white">Take the Floor.</span>
            </h2>

            <p className="mt-4 sm:mt-5 text-xs sm:text-base text-[#C4BAA8] max-w-lg mx-auto font-light leading-relaxed">
              Register early interest for ICON MUN 2027. Official dates, council allotments, and conference details are To Be Announced (TBA).
            </p>

            {/* Action Button */}
            <div
              ref={buttonWrapperRef}
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 will-change-transform w-full max-w-xs sm:max-w-none mx-auto"
            >
              <button
                type="button"
                onClick={onOpenModal}
                className="gold-btn-primary w-full sm:w-auto px-9 py-4 min-h-[48px] text-xs sm:text-sm font-bold uppercase tracking-[0.25em] rounded-md shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                Register Interest (TBA)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Credential Application Modal */}
      {isOpenModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseModal();
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="gold-card max-w-3xl w-full rounded-2xl p-6 sm:p-10 max-h-[90vh] overflow-y-auto border-[#D4AF6A]/60 bg-[#0C0C0C] relative shadow-[0_0_80px_rgba(0,0,0,0.98)]"
          >
            {/* Primary Close Button (X) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCloseModal();
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 h-11 w-11 flex items-center justify-center rounded-full bg-[#181818] border border-[#D4AF6A]/50 text-[#F3DFA2] hover:text-white hover:bg-[#252525] hover:border-[#D4AF6A] transition-all cursor-pointer active:scale-90 shadow-xl"
              aria-label="Close registration modal"
            >
              <X className="h-5 w-5 pointer-events-none" />
            </button>

            {!isSubmitted ? (
              <>
                <div className="mb-6 pr-10">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF6A] mb-1 font-medium">
                    ICON MUN 2027 Registration
                  </div>
                  <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient">
                    Delegate Registration (TBA)
                  </h3>
                  <p className="text-xs text-[#A89D8A] mt-1">
                    All conference fees, dates, and venues are To Be Announced (TBA) by the Secretariat.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-2 font-medium">
                      Delegation Status (TBA)
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
                          {type === 'single' && 'Single Delegate (TBA)'}
                          {type === 'double' && 'Double Delegate (TBA)'}
                          {type === 'head' && 'Head Delegate (TBA)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 min-h-[44px] text-base text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        School / Institution *
                      </label>
                      <input
                        type="text"
                        required
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="Your institution name"
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 min-h-[44px] text-base text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 min-h-[44px] text-base text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Council Preference (TBA)
                      </label>
                      <select
                        value={committee}
                        onChange={(e) => setCommittee(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 min-h-[44px] text-base text-white focus:border-[#D4AF6A] focus:outline-none"
                      >
                        <option value="TBA">Council Allotment: TBA</option>
                        {committees.map((c) => (
                          <option key={c.id} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Country Preference (TBA)
                      </label>
                      <input
                        type="text"
                        value={firstCountry}
                        onChange={(e) => setFirstCountry(e.target.value)}
                        placeholder="Country preferences TBA"
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 min-h-[44px] text-base text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                        Experience Level
                      </label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 min-h-[44px] text-base text-white focus:border-[#D4AF6A] focus:outline-none"
                      >
                        <option value="TBA">Level: TBA</option>
                        <option value="Novice">Novice</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#C4BAA8] block mb-1.5 font-medium">
                      Notes or Inquiries (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      placeholder="Any questions for the Secretariat..."
                      className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 text-base text-white placeholder-white/20 focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  {/* Honeypot: invisible to people, tempting to bots */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Website
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </label>
                  </div>

                  <p className="text-[11px] leading-relaxed text-[#8E8678]">
                    Your details are stored securely and are visible only to the ICON MUN organisers, who use them to contact you about the conference.
                  </p>

                  {!registrationOpen && (
                    <p role="alert" className="rounded-lg border border-[#D4AF6A]/40 bg-[#D4AF6A]/10 px-4 py-3 text-sm text-[#F3DFA2]">
                      Registration is currently closed.
                    </p>
                  )}
                  {submitError && (
                    <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {submitError}
                    </p>
                  )}

                  <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCloseModal();
                      }}
                      className="px-5 py-3 min-h-[44px] text-xs uppercase tracking-wider text-[#A89D8A] hover:text-white cursor-pointer flex items-center justify-center active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSending || !registrationOpen}
                      className="gold-btn-primary px-8 py-3.5 min-h-[48px] text-xs font-bold uppercase tracking-widest rounded-lg cursor-pointer flex items-center justify-center active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? 'Sending…' : 'Submit Registration (TBA)'}
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
                  Registration Deposited
                </h3>
                <p className="text-xs text-[#C4BAA8] max-w-md mx-auto mb-8 font-light">
                  Your interest has been submitted to the High Secretariat. All official conference announcements are TBA.
                </p>

                <div className="max-w-md mx-auto rounded-2xl border-2 border-[#D4AF6A] bg-gradient-to-b from-[#161616] to-[#0A0A0A] p-6 text-left relative shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#8C6221] via-[#D4AF6A] to-[#FFF3D6]" />
                  <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                    <div>
                      <div className="font-cinzel text-lg font-bold text-[#F3DFA2]">
                        ICON MUN 2027
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-[#D4AF6A]">
                        Provisional Registration Pass
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-[#D4AF6A]">#ICN-2027</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/50">All Details: TBA</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#A89D8A] block">
                        Delegate Name
                      </span>
                      <span className="font-medium text-sm text-white">
                        {fullName || 'Delegate'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#A89D8A] block">
                          Council Assigned
                        </span>
                        <span className="font-medium text-xs text-[#F3DFA2]">
                          TBA
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#A89D8A] block">
                          Dates & Venue
                        </span>
                        <span className="font-medium text-xs text-[#F3DFA2]">
                          TBA
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-[#A89D8A]">
                    <span>Status: Registry Recorded</span>
                    <span className="font-mono text-[#D4AF6A]">TBA</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="gold-btn-primary px-8 py-3 text-xs font-semibold uppercase tracking-wider rounded cursor-pointer"
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
