import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, MapPin, CalendarDays } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';

gsap.registerPlugin(ScrollTrigger);

export const ScheduleSection: React.FC = () => {
  const { schedule: SCHEDULE_GROUPS } = useSiteData();
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
      // 1. Vertical gold line draws downward with smooth scrub
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
            scrub: 0.8,
            onUpdate: (self) => {
              const h = trackWrapper.offsetHeight;
              const yVal = self.progress * h;
              dot.style.transform = `translate3d(0, ${yVal}px, 0)`;
              dot.style.opacity = self.progress > 0.02 && self.progress < 0.98 ? '1' : '0.2';
            },
          },
        }
      );

      // 2. Day huge outlined numbers fill with gold
      const dayHeadings = container.querySelectorAll('.day-heading-outline');
      dayHeadings.forEach((heading) => {
        gsap.fromTo(
          heading,
          {
            backgroundPosition: '0% 100%',
            opacity: 0.35,
          },
          {
            backgroundPosition: '0% 0%',
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: heading,
              start: 'top 80%',
              end: 'top 35%',
              scrub: 0.8,
            },
          }
        );
      });

      // 3. Event cards slide in smoothly
      const leftCards = container.querySelectorAll('.schedule-card-left');
      leftCards.forEach((card) => {
        gsap.fromTo(
          card,
          { x: -35, opacity: 0.2 },
          {
            x: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 55%',
              scrub: 0.8,
            },
          }
        );
      });

      const rightCards = container.querySelectorAll('.schedule-card-right');
      rightCards.forEach((card) => {
        gsap.fromTo(
          card,
          { x: 35, opacity: 0.2 },
          {
            x: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 55%',
              scrub: 0.8,
            },
          }
        );
      });
    }, container);

    return () => ctx.revert();
  }, [SCHEDULE_GROUPS]);

  return (
    <section
      ref={containerRef}
      id="schedule"
      className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-transparent text-ink overflow-hidden"
    >
      <div className="mx-auto max-w-5xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-gold mb-2">
            <span>Conference Itinerary</span>
            <span aria-hidden="true" className="text-golddeep">·</span>
            <span>ICON MUN 2027</span>
          </div>
          <h2 className="font-cinzel text-[clamp(1.75rem,5vw,3rem)] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-gold-gradient text-balance">
            Timeline (TBA)
          </h2>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-accent">
            <CalendarDays className="h-3.5 w-3.5 text-gold" />
            <span>Dates & Timetable: To Be Announced (TBA)</span>
          </div>
          <div className="mx-auto mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>

        {/* Schedule Groups Container with Track */}
        <div ref={trackWrapperRef} className="space-y-16 relative">
          {/* Central Track Gray Base */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-ink/10 pointer-events-none" />

          {/* Scrubbed Drawing Gold Line (ScaleY) */}
          <div
            ref={lineRef}
            className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-inkstrong via-gold to-golddeep shadow-[0_0_12px_rgba(231,219,195,0.9)] will-change-transform pointer-events-none"
          />

          {/* Tip Dot (TranslateY Only) */}
          <div
            ref={dotRef}
            className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 pointer-events-none will-change-transform"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-inkstrong shadow-[0_0_10px_#F3EAD6]" />
          </div>

          {SCHEDULE_GROUPS.map((group) => (
            <div key={group.id} className="relative pt-4">
              {/* Huge Outlined Day Number */}
              <div className="text-center mb-8 select-none">
                <span
                  className="day-heading-outline font-cinzel text-[clamp(2.75rem,8vw,5.5rem)] font-black uppercase tracking-[0.12em] inline-block"
                  style={{
                    WebkitTextStroke: '1px rgba(231, 219, 195, 0.4)',
                    backgroundImage: 'linear-gradient(to top, #E7DBC3 50%, transparent 50%)',
                    backgroundSize: '100% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {group.dayLabel}
                </span>
                <p className="font-cinzel text-xs sm:text-sm uppercase tracking-[0.25em] text-gold -mt-2">
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
                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-15 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-gold bg-paper">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </div>

                      {/* Card (All on right of line on mobile; alternating on desktop) */}
                      <div
                        className={`ml-8 sm:ml-10 md:ml-0 w-[calc(100%-2.25rem)] sm:w-[calc(100%-2.75rem)] md:w-1/2 ${
                          isLeft
                            ? 'schedule-card-left md:pr-10 md:text-right'
                            : 'schedule-card-right md:pl-10 md:text-left'
                        } will-change-transform`}
                      >
                        <div className="gold-card rounded-xl p-5 transition-all duration-300 hover:border-gold/60 bg-[#0C0C0C]/75 backdrop-blur-md border border-gold/20 shadow-xl">
                          <div
                            className={`flex flex-wrap items-center gap-2.5 text-xs text-gold mb-1.5 ${
                              isLeft ? 'md:justify-end' : 'md:justify-start'
                            }`}
                          >
                            <span className="flex items-center gap-1 font-mono tabular-nums">
                              <Clock className="h-3 w-3 text-gold" />
                              {event.time}
                            </span>
                            {event.badge && (
                              <span className="rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[9px] uppercase font-mono text-accent">
                                {event.badge}
                              </span>
                            )}
                          </div>

                          <h3 className="font-cinzel text-sm sm:text-base font-semibold text-inkstrong mb-1.5">
                            {event.title}
                          </h3>

                          <p className="text-xs text-ink2 leading-relaxed mb-2.5 font-light">
                            {event.description}
                          </p>

                          <div
                            className={`flex items-center gap-1.5 text-xs text-ink3 ${
                              isLeft ? 'md:justify-end' : 'md:justify-start'
                            }`}
                          >
                            <MapPin className="h-3 w-3 text-gold" />
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
