import { useEffect, useState } from 'react';
import type { TrackItem, TrackKey } from '../data/defaults';

export type TrackState = 'open' | 'upcoming' | 'closed';

export interface TrackStatus {
  state: TrackState;
  /** Short word for the pill: "Available", "Opens soon", or the closed label ("Closed" / "Full") */
  label: string;
  /** Optional second line: "Closes 12 Nov, 18:00" / "Opens 3 Nov, 10:00" */
  detail: string;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** The one place that decides whether a track accepts applications right now.
 *  The database applies the same rule (track_is_open), so this is only for display. */
export function getTrackStatus(t: TrackItem, now: number = Date.now()): TrackStatus {
  const opens = t.opensAt ? new Date(t.opensAt).getTime() : null;
  const closes = t.closesAt ? new Date(t.closesAt).getTime() : null;

  if (!t.isOpen) return { state: 'closed', label: t.closedLabel, detail: '' };
  if (closes !== null && closes <= now) return { state: 'closed', label: t.closedLabel, detail: '' };
  if (opens !== null && opens > now) return { state: 'upcoming', label: 'Opens soon', detail: `Opens ${fmt(t.opensAt!)}` };
  return { state: 'open', label: 'Available', detail: closes !== null ? `Closes ${fmt(t.closesAt!)}` : '' };
}

/** Re-evaluates every 20 seconds so a scheduled open/close shows up without a page reload. */
export function useNow(intervalMs = 20000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export interface TrackMeta {
  title: string;
  verb: string; // button text when open
  focusLabel: string;
  focusOptions: string[];
  statementLabel: string;
  statementPlaceholder: string;
}

/** Wording and extra questions for the three team applications. */
export const TEAM_META: Record<Exclude<TrackKey, 'delegate'>, TrackMeta> = {
  volunteer: {
    title: 'Volunteer',
    verb: 'Apply as volunteer',
    focusLabel: 'Where would you like to help?',
    focusOptions: ['Registration desk', 'Logistics', 'Delegate care', 'Committee support', 'No preference'],
    statementLabel: 'Why do you want to volunteer?',
    statementPlaceholder: 'A few sentences about yourself and what you can offer.',
  },
  security: {
    title: 'Security',
    verb: 'Apply to security',
    focusLabel: 'Preferred duty',
    focusOptions: ['Entrance & accreditation checks', 'Crowd flow', 'Emergency & first-aid support', 'No preference'],
    statementLabel: 'Why do you want to join security?',
    statementPlaceholder: 'Any relevant experience, training or responsibilities you have had.',
  },
  media: {
    title: 'Media',
    verb: 'Apply to media',
    focusLabel: 'Your specialty',
    focusOptions: ['Photography', 'Videography', 'Graphic design', 'Social media', 'Writing & press', 'No preference'],
    statementLabel: 'Tell us about your work',
    statementPlaceholder: 'Links to a portfolio or past work help (Instagram, Drive, YouTube...).',
  },
};
