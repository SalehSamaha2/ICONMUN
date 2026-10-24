import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getSupabase } from './supabase';
import {
  DEFAULT_CONTENT,
  type CommitteeItem,
  type IconKey,
  type ScheduleGroupItem,
  type SecretariatItem,
  type SiteContent,
} from '../data/defaults';

const SiteDataContext = createContext<SiteContent>(DEFAULT_CONTENT);

export const useSiteData = () => useContext(SiteDataContext);

const ICON_KEYS: IconKey[] = ['shield', 'eye', 'lock', 'activity', 'landmark'];

/**
 * Shows DEFAULT_CONTENT immediately, then swaps in the database content when it arrives.
 * If Supabase is missing / offline / returns nothing for a section, that section keeps
 * its defaults, so the public site can never end up blank.
 */
export const SiteDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const lastJson = useRef(JSON.stringify(DEFAULT_CONTENT));
  const changed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const clientP = getSupabase();
    if (!clientP) return;

    (async () => {
      try {
        const sb = await clientP;
        const [com, days, evs, sec, set] = await Promise.all([
          sb.from('committees').select('*').eq('is_published', true).order('sort_order'),
          sb.from('schedule_days').select('*').eq('is_published', true).order('sort_order'),
          sb.from('schedule_events').select('*').eq('is_published', true).order('sort_order'),
          sb.from('secretariat').select('*').eq('is_published', true).order('sort_order'),
          sb.from('settings').select('key,value'),
        ]);
        if (cancelled) return;

        const next: SiteContent = { ...DEFAULT_CONTENT };

        if (!com.error && com.data && com.data.length > 0) {
          next.committees = com.data.map(
            (r): CommitteeItem => ({
              id: r.id,
              code: r.code,
              name: r.name,
              iconKey: ICON_KEYS.includes(r.icon) ? r.icon : 'shield',
              topic: r.topic,
              level: r.level,
              seats: r.seats,
              charter: r.charter,
              focusQuestions: r.focus_questions ?? [],
              keyCountries: r.key_countries ?? [],
              backgroundGuideOverview: r.background_overview,
            })
          );
        }

        if (!days.error && !evs.error && days.data && days.data.length > 0) {
          next.schedule = days.data.map(
            (d): ScheduleGroupItem => ({
              id: d.id,
              dayNumber: d.day_number,
              dayLabel: d.day_label,
              dayTheme: d.day_theme,
              events: (evs.data ?? [])
                .filter((e) => e.day_id === d.id)
                .map((e) => ({
                  time: e.time_label,
                  title: e.title,
                  location: e.location,
                  description: e.description,
                  badge: e.badge || undefined,
                })),
            })
          );
        }

        if (!sec.error && sec.data && sec.data.length > 0) {
          next.secretariat = sec.data.map(
            (r): SecretariatItem => ({
              id: r.id,
              name: r.name,
              role: r.role,
              image: r.image_url || undefined,
              quote: r.quote,
              bio: r.bio,
              isConfirmed: r.is_confirmed,
              objectPosition: r.object_position,
            })
          );
        }

        if (!set.error && set.data) {
          const merged = { ...DEFAULT_CONTENT.settings };
          for (const row of set.data) merged[row.key] = row.value;
          next.settings = merged;
        }

        // Only re-render (and rebuild the scroll animations) if something really differs.
        const json = JSON.stringify(next);
        if (json !== lastJson.current) {
          lastJson.current = json;
          changed.current = true;
          setContent(next);
        }
      } catch {
        /* keep defaults */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // After new content is in the DOM, let GSAP re-measure the pinned sections.
  useEffect(() => {
    if (!changed.current) return;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [content]);

  return <SiteDataContext.Provider value={content}>{children}</SiteDataContext.Provider>;
};
