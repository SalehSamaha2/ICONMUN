import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, MapPin, Phone, Instagram, Linkedin, Twitter, Send } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const FooterSection: React.FC = () => {
  const footerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const giantLogoRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const ctx = gsap.context(() => {
      // 1. Contacts and details rise up with scroll (scrub: 0.5)
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current.children,
          { y: 35, opacity: 0.2 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: footer,
              start: 'top 85%',
              end: 'top 40%',
              scrub: 0.5,
            },
          }
        );
      }

      // 2. Giant outlined "ICON MUN" fills with gold from bottom to top as you reach the page end
      if (giantLogoRef.current) {
        gsap.fromTo(
          giantLogoRef.current,
          {
            backgroundPosition: '0% 100%',
            opacity: 0.35,
          },
          {
            backgroundPosition: '0% 0%',
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: giantLogoRef.current,
              start: 'top 95%',
              end: 'bottom bottom',
              scrub: 0.5,
            },
          }
        );
      }
    }, footer);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#050505] text-[#A89D8A] border-t border-[#D4AF6A]/20 pt-16 pb-10 px-6 lg:px-12 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Content Columns (Rise up with scroll) */}
        <div
          ref={contentRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/5"
        >
          {/* Brand & Mandate */}
          <div className="lg:col-span-5 space-y-3">
            <span className="font-cinzel text-2xl font-bold uppercase tracking-[0.25em] text-[#F3DFA2] inline-block">
              ICON MUN
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF6A]">
              The International Masquerade of Diplomacy
            </p>
            <p className="text-xs leading-relaxed text-[#8E8678] max-w-sm font-light">
              A sovereign simulation where rhetoric meets consequence. Convened annually under the Geneva Accords to cultivate the next echelon of global strategists.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="#social-instagram"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D4AF6A]/30 bg-[#0C0C0C] text-[#D4AF6A] transition-all hover:border-[#D4AF6A] hover:bg-[#D4AF6A]/10 hover:text-[#FFF3D6]"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a
                href="#social-linkedin"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D4AF6A]/30 bg-[#0C0C0C] text-[#D4AF6A] transition-all hover:border-[#D4AF6A] hover:bg-[#D4AF6A]/10 hover:text-[#FFF3D6]"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
              <a
                href="#social-twitter"
                aria-label="X / Twitter"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D4AF6A]/30 bg-[#0C0C0C] text-[#D4AF6A] transition-all hover:border-[#D4AF6A] hover:bg-[#D4AF6A]/10 hover:text-[#FFF3D6]"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a
                href="#social-telegram"
                aria-label="Telegram"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D4AF6A]/30 bg-[#0C0C0C] text-[#D4AF6A] transition-all hover:border-[#D4AF6A] hover:bg-[#D4AF6A]/10 hover:text-[#FFF3D6]"
              >
                <Send className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#F3DFA2]">
              Proceedings
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#about" className="hover:text-[#F3DFA2] transition-colors">
                  The Diplomatic Mask
                </a>
              </li>
              <li>
                <a href="#committees" className="hover:text-[#F3DFA2] transition-colors">
                  Council Chambers (UNSC, UNHRC, DISEC)
                </a>
              </li>
              <li>
                <a href="#schedule" className="hover:text-[#F3DFA2] transition-colors">
                  Three-Day Itinerary & Crisis
                </a>
              </li>
              <li>
                <a href="#secretariat" className="hover:text-[#F3DFA2] transition-colors">
                  High Secretariat & Directorate
                </a>
              </li>
              <li>
                <a href="#registration" className="hover:text-[#F3DFA2] transition-colors">
                  Accreditation & Badging
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-4 space-y-2.5">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#F3DFA2]">
              Secretariat Chancellery
            </h4>
            <div className="space-y-2 text-xs text-[#8E8678]">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-[#D4AF6A] shrink-0 mt-0.5" />
                <span>Palais des Congrès Diplomatique, Quartier des Nations, Geneva, Switzerland</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 text-[#D4AF6A] shrink-0" />
                <span>secretariat@iconmun.org</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 text-[#D4AF6A] shrink-0" />
                <span>+41 22 798 4400 (Diplomatic Dispatch)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Huge Outlined "ICON MUN" that fills with gold at bottom */}
        <div className="pt-8 pb-4 text-center select-none overflow-hidden">
          <h2
            ref={giantLogoRef}
            className="font-cinzel font-black uppercase text-6xl sm:text-9xl md:text-[11rem] lg:text-[13rem] leading-none tracking-[0.1em] will-change-transform"
            style={{
              WebkitTextStroke: '1px rgba(212, 175, 106, 0.45)',
              backgroundImage: 'linear-gradient(to top, #D4AF6A 50%, transparent 50%)',
              backgroundSize: '100% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ICON MUN
          </h2>
        </div>

        {/* Copyright and Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 text-[10px] text-[#6E675B] uppercase tracking-widest font-mono">
          <div>
            © {new Date().getFullYear()} ICON MUN Directorate. All sovereign rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#D4AF6A]">Geneva Protocol Verified</span>
            <span>·</span>
            <span>Chatham House Rule Preserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
