import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, MapPin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ScheduleGroup {
  dayNumber: number;
  dayLabel: string;
  dayTheme: string;
  events: Array<{
    time: string;
    title: string;
    location: string;
    description: string;
    badge?: string;
  }>;
}

const SCHEDULE_GROUPS: ScheduleGroup[] = [
  {
    dayNumber: 1,
    dayLabel: 'DAY 01',
    dayTheme: 'The Diplomatic Masquerade & Roll Call',
    events: [
      {
        time: '14:00 – 16:30',
        title: 'Diplomatic Accreditations & Delegate Badging',
        location: 'Palais Foyer',
        description: 'Collection of official credential badges, council placards, and classified briefing folders.',
      },
      {
        time: '17:00 – 18:30',
        title: 'Opening Plenary & Keynote Address',
        location: 'Grand Sovereign Hall',
        description: 'Address by the Secretary-General on statecraft, followed by declaration of session opening.',
        badge: 'Ceremonial',
      },
      {
        time: '19:00 – 21:30',
        title: 'Committee Session I: Agenda Setting & Roll Call',
        location: 'Respective Council Chambers',
        description: 'Setting of the agenda, opening speeches, and establishment of initial caucusing blocs.',
      },
      {
        time: '22:00 – 23:30',
        title: 'Masquerade Welcome Reception',
        location: 'The Obsidian Atrium',
        description: 'Informal bilateral mixer in black-tie masquerade attire. Unmoderated networking.',
        badge: 'Social Event',
      },
    ],
  },
  {
    dayNumber: 2,
    dayLabel: 'DAY 02',
    dayTheme: 'Clandestine Directives & Flashpoint Crisis',
    events: [
      {
        time: '09:00 – 12:30',
        title: 'Committee Session II: Moderated Caucus & Directives',
        location: 'Respective Council Chambers',
        description: 'Substantive debates on agenda sub-topics. Introduction of preliminary working papers.',
      },
      {
        time: '14:00 – 18:00',
        title: 'Committee Session III: Flashpoint Crisis Infiltration',
        location: 'Council Chambers & Situation Rooms',
        description: 'Unannounced geopolitical crisis event delivered by Crisis Directorate. Emergency caucusing.',
        badge: 'Crisis Active',
      },
      {
        time: '20:00 – 00:00',
        title: 'Midnight Working Papers & Caucusing',
        location: 'Delegates Library & Diplomatic Suites',
        description: 'Collaborative treaty drafting, sponsor signatory collation, and back-channel negotiation.',
      },
    ],
  },
  {
    dayNumber: 3,
    dayLabel: 'DAY 03',
    dayTheme: 'Treaty Codification & Plenary Voting',
    events: [
      {
        time: '09:30 – 13:00',
        title: 'Committee Session IV: Draft Resolution Amendments',
        location: 'Respective Council Chambers',
        description: 'Debating friendly and unfriendly amendments. Line-by-line scrutiny of draft resolutions.',
      },
      {
        time: '14:30 – 16:30',
        title: 'Plenary Voting Procedure & Final Accords',
        location: 'Grand Sovereign Hall',
        description: 'Roll call voting on all sponsored resolutions. Official deposit of signed treaties.',
        badge: 'Voting Mandate',
      },
      {
        time: '17:30 – 19:30',
        title: 'Closing Ceremony & Diplomatic Awards',
        location: 'Grand Sovereign Hall',
        description: 'Presentation of Best Delegate, Outstanding Delegation, and Diplomacy Gavel honors.',
        badge: 'Awards',
      },
    ],
  },
];

export const ScheduleSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackWrapperRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const trackWrapper = trackWrapperRef.current;
    const line = lineRef.current;
    const dot = dotRef.current;
    if (!container || !trackWrapper || !line || !dot) return;

    const ctx = gsap.context(() => {
      // 1. Vertical gold line draws downward with scroll (scrub: 0.5)
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          transformOrigin: 'top center',
          scrollTrigger: {
            trigger: trackWrapper,
            start: 'top 70%',
            end: 'bottom 80%',
            scrub: 0.5,
            onUpdate: (self) => {
              const h = trackWrapper.offsetHeight;
              const yVal = self.progress * h;
              // Animate ONLY transform and opacity
              dot.style.transform = `translate3d(0, ${yVal}px, 0)`;
              dot.style.opacity = self.progress > 0.02 && self.progress < 0.98 ? '1' : '0.2';
            },
          },
        }
      );

      // 2. Day huge outlined numbers fill with gold as they cross screen center
      const dayHeadings = container.querySelectorAll('.day-heading-outline');
      dayHeadings.forEach((heading) => {
        gsap.fromTo(
          heading,
          {
            backgroundPosition: '0% 100%',
            opacity: 0.4,
          },
          {
            backgroundPosition: '0% 0%',
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: heading,
              start: 'top 80%',
              end: 'top 35%',
              scrub: 0.5,
            },
          }
        );
      });

      // 3. Event cards slide in from alternating sides
      const leftCards = container.querySelectorAll('.schedule-card-left');
      leftCards.forEach((card) => {
        gsap.fromTo(
          card,
          { x: -50, opacity: 0.2 },
          {
            x: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 55%',
              scrub: 0.5,
            },
          }
        );
      });

      const rightCards = container.querySelectorAll('.schedule-card-right');
      rightCards.forEach((card) => {
        gsap.fromTo(
          card,
          { x: 50, opacity: 0.2 },
          {
            x: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 55%',
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
      id="schedule"
      className="relative py-24 px-6 lg:px-12 bg-[#050505] text-[#E6E1D8] overflow-hidden"
    >
      <div className="mx-auto max-w-5xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-[#D4AF6A] mb-2">
            <span>Conference Itinerary</span>
            <span aria-hidden="true" className="text-[#8C6221]">·</span>
            <span>Three Days of Statecraft</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-[0.18em] text-gold-gradient text-balance">
            The Timeline of Power
          </h2>
          <div className="mx-auto mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-[#D4AF6A] to-transparent" />
        </div>

        {/* Schedule Groups Container with Track */}
        <div ref={trackWrapperRef} className="space-y-16 relative">
          {/* Central Track Gray Base */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-white/10 pointer-events-none" />

          {/* Scrubbed Drawing Gold Line (ScaleY) */}
          <div
            ref={lineRef}
            className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-[#FFF3D6] via-[#D4AF6A] to-[#8C6221] shadow-[0_0_12px_rgba(212,175,106,0.9)] will-change-transform pointer-events-none"
          />

          {/* Tip Dot (TranslateY Only) */}
          <div
            ref={dotRef}
            className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF6A]/20 pointer-events-none will-change-transform"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-[#FFF3D6] shadow-[0_0_10px_#F3DFA2]" />
          </div>

          {SCHEDULE_GROUPS.map((group) => (
            <div key={group.dayNumber} className="relative pt-4">
              {/* Huge Outlined Day Number */}
              <div className="text-center mb-8 select-none">
                <span
                  className="day-heading-outline font-cinzel text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-[0.12em] inline-block"
                  style={{
                    WebkitTextStroke: '1px rgba(212, 175, 106, 0.4)',
                    backgroundImage: 'linear-gradient(to top, #D4AF6A 50%, transparent 50%)',
                    backgroundSize: '100% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {group.dayLabel}
                </span>
                <p className="font-cinzel text-xs sm:text-sm uppercase tracking-[0.25em] text-[#D4AF6A] -mt-2">
                  {group.dayTheme}
                </p>
              </div>

              {/* Day Events */}
              <div className="space-y-8">
                {group.events.map((event, eIdx) => {
                  const isLeft = eIdx % 2 === 0;

                  return (
                    <div
                      key={eIdx}
                      className={`relative flex flex-col md:flex-row items-center ${
                        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                    >
                      {/* Node Circle */}
                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-15 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#D4AF6A] bg-[#0A0A0A]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#F3DFA2]" />
                      </div>

                      {/* Card (Slides in from Left or Right) */}
                      <div
                        className={`ml-10 md:ml-0 md:w-1/2 ${
                          isLeft
                            ? 'schedule-card-left md:pr-10 md:text-right'
                            : 'schedule-card-right md:pl-10 md:text-left'
                        } w-full will-change-transform`}
                      >
                        <div className="gold-card rounded-xl p-5 transition-all duration-200 hover:border-[#D4AF6A]/60 bg-[#0C0C0C]">
                          <div
                            className={`flex flex-wrap items-center gap-2.5 text-xs text-[#D4AF6A] mb-1.5 ${
                              isLeft ? 'md:justify-end' : 'md:justify-start'
                            }`}
                          >
                            <span className="flex items-center gap-1 font-mono tabular-nums">
                              <Clock className="h-3 w-3 text-[#D4AF6A]" />
                              {event.time}
                            </span>
                            {event.badge && (
                              <span className="rounded border border-[#5A0F1E] bg-[#5A0F1E]/20 px-1.5 py-0.5 text-[9px] uppercase font-mono text-[#F3DFA2]">
                                {event.badge}
                              </span>
                            )}
                          </div>

                          <h3 className="font-cinzel text-sm sm:text-base font-semibold text-white mb-1.5">
                            {event.title}
                          </h3>

                          <p className="text-xs text-[#C4BAA8] leading-relaxed mb-2.5 font-light">
                            {event.description}
                          </p>

                          <div
                            className={`flex items-center gap-1.5 text-xs text-[#A89D8A] ${
                              isLeft ? 'md:justify-end' : 'md:justify-start'
                            }`}
                          >
                            <MapPin className="h-3 w-3 text-[#D4AF6A]" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
