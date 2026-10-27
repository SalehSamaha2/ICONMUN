import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, MapPin, Phone, Instagram, Linkedin, Twitter, Send } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import { safeUrl } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

// Social links: real https link (opens in a new tab) when set in the admin, otherwise the old placeholder.
const socialProps = (value: string | undefined, fallback: string) => {
  const url = safeUrl(value);
  return url
    ? { href: url, target: '_blank', rel: 'noopener noreferrer' }
    : { href: fallback };
};

export const FooterSection: React.FC = () => {
  const { settings } = useSiteData();
  const rawEmail = (settings.contact_email || '').trim();
  const contactEmail = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(rawEmail) ? rawEmail : '';
  const footerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const giantLogoRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const ctx = gsap.context(() => {
      // 1. Contacts and details rise up smoothly once
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current.children,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: footer,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      // 2. Giant outlined "ICON MUN" fills with gold smoothly once
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
            duration: 1.0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: giantLogoRef.current,
              start: 'top 95%',
              once: true,
            },
          }
        );
      }
    }, footer);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      data-theme="dark"
      ref={footerRef}
      className="relative bg-transparent text-ink2 border-t border-gold/25 pt-16 pb-[max(2rem,env(safe-area-inset-bottom,0px))] px-4 sm:px-6 lg:px-12 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Content Columns (Rise up with scroll) */}
        <div
          ref={contentRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10 pb-12 border-b border-ink/5"
        >
          {/* Brand & Mandate */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E7DBC3]"><img src="/brand/logo-mark.webp" alt="" className="h-14 w-14 object-contain" loading="lazy" /></span>
              <span className="font-cinzel text-2xl font-bold uppercase tracking-[0.25em] text-accent inline-block">
                ICON MUN
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">
              The International Masquerade of Diplomacy · 2027
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-ink4 max-w-sm font-light">
              A sovereign simulation where rhetoric meets consequence. Convening international delegates to debate, deliberate, and create the best and most memorable MUN experience.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                {...socialProps(settings.instagram_url, "#social-instagram")}
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 bg-surface text-gold transition-all hover:border-gold hover:bg-gold/10 hover:text-inkstrong active:scale-95"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                {...socialProps(settings.linkedin_url, "#social-linkedin")}
                aria-label="LinkedIn"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 bg-surface text-gold transition-all hover:border-gold hover:bg-gold/10 hover:text-inkstrong active:scale-95"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                {...socialProps(settings.twitter_url, "#social-twitter")}
                aria-label="X / Twitter"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 bg-surface text-gold transition-all hover:border-gold hover:bg-gold/10 hover:text-inkstrong active:scale-95"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                {...socialProps(settings.telegram_url, "#social-telegram")}
                aria-label="Telegram"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 bg-surface text-gold transition-all hover:border-gold hover:bg-gold/10 hover:text-inkstrong active:scale-95"
              >
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.25em] text-accent">
              Proceedings
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#about" className="hover:text-accent transition-colors py-1 inline-block">
                  The Diplomatic Mask
                </a>
              </li>
              <li>
                <a href="#committees" className="hover:text-accent transition-colors py-1 inline-block">
                  Councils & Chambers
                </a>
              </li>
              <li>
                <a href="#schedule" className="hover:text-accent transition-colors py-1 inline-block">
                  Conference Itinerary (TBA)
                </a>
              </li>
              <li>
                <a href="#secretariat" className="hover:text-accent transition-colors py-1 inline-block">
                  High Secretariat
                </a>
              </li>
              <li>
                <a href="#registration" className="hover:text-accent transition-colors py-1 inline-block">
                  Registration & Badging
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details with TBA status */}
          <div className="lg:col-span-4 space-y-2.5">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.25em] text-accent">
              Secretariat Chancellery
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-ink4">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <span>Venue & Location: {settings.venue?.trim() || 'TBA'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-gold shrink-0" />
                {contactEmail ? (
                  <span>Email: <a href={`mailto:${contactEmail}`} className="hover:text-accent transition-colors">{contactEmail}</a></span>
                ) : (
                  <span>Email: TBA</span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-gold shrink-0" />
                <span>Phone / Contact: {settings.contact_phone?.trim() || 'TBA'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Huge Outlined "ICON MUN" that fills with gold at bottom */}
        <div className="pt-8 pb-4 text-center select-none overflow-hidden">
          <h2
            ref={giantLogoRef}
            className="font-cinzel font-black uppercase text-[clamp(3.5rem,15vw,13rem)] leading-none tracking-[0.06em] sm:tracking-[0.1em] will-change-transform"
            style={{
              WebkitTextStroke: '1px rgba(231, 219, 195, 0.45)',
              backgroundImage: 'linear-gradient(to top, #E7DBC3 50%, transparent 50%)',
              backgroundSize: '100% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ICON MUN
          </h2>
        </div>

        {/* Copyright and Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-ink/5 text-[10px] text-ink4 uppercase tracking-widest font-mono">
          <div>
            © 2027 ICON MUN Directorate. All sovereign rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gold">ICON MUN 2027</span>
            <span>·</span>
            <span>Chatham House Rule Preserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
