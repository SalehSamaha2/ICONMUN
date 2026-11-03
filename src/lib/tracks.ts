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

export interface TeamQuestion {
  id: string;
  prompt: string;
  minWords?: number;
  minWordsLabel?: string;
  placeholder?: string;
}

export interface TrackMeta {\n  title: string;\n  verb: string;\n  questions: TeamQuestion[];\n}\n\n/** Required written questions shown on each team application. */
export const TEAM_META: Record<Exclude<TrackKey, 'delegate'>, TrackMeta> = {
  media: {
    title: 'Media',
    verb: 'Apply to media',
    questions: [
      { id: 'gender', prompt: 'Gender (Male / Female)' },
      { id: 'birth_date', prompt: 'Date of birth' },
      { id: 'grade', prompt: 'Grade (9, 10, 11, 12, or first-year university)' },
      { id: 'emergency_contact', prompt: 'Emergency contact number and your relationship to that person', placeholder: 'Include the country code and relationship (for example, parent or guardian).' },
      { id: 'experience', prompt: 'Describe your previous media, photography, videography, design, or event experience. Write N/A if you have none.' },
      { id: 'certificates', prompt: 'List any relevant media, photography, videography, or design certificates you hold. Write N/A if none.' },
      { id: 'choose_you', prompt: 'Why should we choose you over other applicants?', minWords: 40, minWordsLabel: '40+ words' },
      { id: 'equipment', prompt: 'What equipment do you use? Include the device or camera model where possible.', placeholder: 'For example: camera, lens, phone, microphone, tripod, etc.' },
      { id: 'upload_access', prompt: 'Do you have access to a device (laptop, adapter, or card reader) that lets you upload footage to a shared drive? (Yes / No). Explain if needed.' },
      { id: 'why_media', prompt: 'Why do you want to be part of the ICON MUN Media Team?', minWords: 40, minWordsLabel: '40+ words' },
      { id: 'attendance', prompt: 'Can you attend the entire conference? (Yes / No). If no, explain in the final question.' },
      { id: 'orientation', prompt: 'Can you attend the Media Team orientation/meeting? (Yes / No). If no, explain in the final question.' },
      { id: 'medical', prompt: 'Do you have any medical concerns or conditions the organisers should know about? Write N/A if none.' },
      { id: 'additional', prompt: 'Is there anything else you would like the Media Team to know? Write N/A if none.' },
    ],
  },
  security: {
    title: 'Security',
    verb: 'Apply to security',
    questions: [
      { id: 'emergency_contact', prompt: 'Emergency contact number and your relationship to that person', placeholder: 'Include the country code and relationship (for example, parent or guardian).' },
      { id: 'gender', prompt: 'Gender (Male / Female)' },
      { id: 'grade', prompt: 'Grade (10, 11, 12, or first-year university)' },
      { id: 'experience', prompt: 'Describe your previous relevant experience. List any certificates or qualifications and write N/A if you have none.' },
      { id: 'why_security', prompt: 'Why do you want to join the Security Department?', minWords: 50, minWordsLabel: '50+ words' },
      { id: 'security_role', prompt: 'What do you understand about the role of Security at a MUN conference?', minWords: 60, minWordsLabel: '60+ words' },
      { id: 'conflict_response', prompt: 'If two delegates are fighting during a break, what precautions and steps would you take?', minWords: 70, minWordsLabel: '70+ words' },
      { id: 'rules', prompt: 'How would you help ensure participants follow conference rules?', minWords: 60, minWordsLabel: '60+ words', placeholder: 'Explain how you would communicate expectations and handle non-compliance appropriately.' },
      { id: 'attendance', prompt: 'Can you attend all days of the conference? (Yes / No)' },
      { id: 'additional', prompt: 'Do you have any additional concerns? Write N/A if none.' },
    ],
  },
  volunteer: {
    title: 'Volunteer',
    verb: 'Apply as volunteer',
    questions: [
      { id: 'emergency_contact', prompt: 'Emergency contact number and your relationship to that person', placeholder: 'Include the country code and relationship (for example, parent or guardian).' },
      { id: 'gender', prompt: 'Gender (Male / Female)' },
      { id: 'grade', prompt: 'Grade (10, 11, 12, or first-year university)' },
      { id: 'experience', prompt: 'Describe your previous relevant experience. List any certificates or proof of experience you have and write N/A if none.' },
      { id: 'why_volunteer', prompt: 'Why do you want to join the Volunteer Department?', minWords: 50, minWordsLabel: '50+ words' },
      { id: 'volunteer_role', prompt: 'What do you understand about the role of a Volunteer at a MUN conference?', minWords: 60, minWordsLabel: '60+ words' },
      { id: 'wandering_volunteer', prompt: 'As a volunteer, you notice another volunteer wandering around instead of carrying out their duties. What would you do to help the conference run smoothly?', minWords: 70, minWordsLabel: '70+ words' },
      { id: 'attendance', prompt: 'Can you attend all days of the conference? (Yes / No)' },
      { id: 'additional', prompt: 'Do you have any additional concerns? Write N/A if none.' },
    ],
  },
};
