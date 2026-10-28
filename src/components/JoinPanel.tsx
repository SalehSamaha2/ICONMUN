import React from 'react';
import { Camera, HeartHandshake, Landmark, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import { getTrackStatus, TEAM_META, useNow, type TrackStatus } from '../lib/tracks';
import type { TrackItem, TrackKey } from '../data/defaults';

const ICONS: Record<TrackKey, LucideIcon> = {
  delegate: Landmark,
  volunteer: HeartHandshake,
  security: ShieldCheck,
  media: Camera,
};

export const StatusPill: React.FC<{ status: TrackStatus; className?: string }> = ({ status, className = '' }) => {
  const tone =
    status.state === 'open'
      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
      : status.state === 'upcoming'
        ? 'border-amber-300/40 bg-amber-300/10 text-amber-200'
        : 'border-ink/15 bg-ink/5 text-ink3';
  const dot =
    status.state === 'open'
      ? 'bg-emerald-300 motion-safe:animate-pulse'
      : status.state === 'upcoming'
        ? 'bg-amber-300'
        : 'bg-rose-300/70';
  return (
    <span
      role="status"
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide ${tone} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {status.label}
    </span>
  );
};

interface RowProps {
  track: TrackItem;
  status: TrackStatus;
  primary?: boolean;
  buttonText: string;
  onApply: () => void;
}

const TrackRow: React.FC<RowProps> = ({ track, status, primary, buttonText, onApply }) => {
  const Icon = ICONS[track.key];
  const open = status.state === 'open';
  return (
    <article
      aria-labelledby={`track-${track.key}`}
      className={`flex flex-col gap-4 rounded-2xl border bg-surface/70 text-left backdrop-blur-sm transition-colors sm:flex-row sm:items-center sm:gap-6 ${
        primary ? 'px-5 py-6 sm:px-8 sm:py-8' : 'px-5 py-5 sm:px-8 sm:py-6'
      } ${open ? 'border-gold/40 hover:border-gold/70' : 'border-ink/10'} ${open && primary ? 'shadow-[0_0_50px_-18px_rgba(231,219,195,0.35)]' : ''}`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl border ${open ? 'border-gold/40 text-gold' : 'border-ink/10 text-ink4'} ${
          primary ? 'h-14 w-14' : 'h-12 w-12'
        }`}
      >
        <Icon className={primary ? 'h-7 w-7' : 'h-6 w-6'} />
      </div>

      <div className="min-w-0 flex-1">
        <h3
          id={`track-${track.key}`}
          className={`font-cinzel font-bold text-inkstrong ${primary ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}
        >
          {track.key === 'delegate' ? 'Register as a delegate' : track.title}
        </h3>
        {track.description && <p className="mt-1 max-w-xl text-sm font-light leading-relaxed text-ink2">{track.description}</p>}
        {status.detail && <p className="mt-1.5 text-xs text-ink3">{status.detail}</p>}
      </div>

      <div className="flex w-full shrink-0 flex-col items-stretch gap-2.5 sm:w-52">
        <StatusPill status={status} />
        {open && (
          <button
            type="button"
            onClick={onApply}
            className="gold-btn-primary flex min-h-[46px] cursor-pointer items-center justify-center rounded-lg px-4 text-xs font-bold uppercase tracking-[0.18em] active:scale-95"
          >
            {buttonText}
          </button>
        )}
      </div>
    </article>
  );
};

interface JoinPanelProps {
  onApplyDelegate: () => void;
  onApplyTeam: (key: Exclude<TrackKey, 'delegate'>) => void;
}

/** Delegate registration on its own row, then the three team applications below it. */
export const JoinPanel: React.FC<JoinPanelProps> = ({ onApplyDelegate, onApplyTeam }) => {
  const { tracks } = useSiteData();
  const now = useNow();
  const delegate = tracks.find((t) => t.key === 'delegate');
  const team = tracks.filter((t): t is TrackItem & { key: Exclude<TrackKey, 'delegate'> } => t.key !== 'delegate');

  return (
    <div className="mt-10 w-full space-y-4 sm:mt-12">
      {delegate && (
        <TrackRow
          primary
          track={delegate}
          status={getTrackStatus(delegate, now)}
          buttonText="Register as delegate"
          onApply={onApplyDelegate}
        />
      )}

      <div className="flex items-center gap-4 pb-1 pt-8 sm:pt-10" role="separator" aria-label="Team applications">
        <span className="h-px flex-1 bg-ink/10" />
        <span className="font-cinzel text-sm text-ink2 sm:text-base">Or join the team behind the conference</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="space-y-3">
        {team.map((t) => (
          <TrackRow
            key={t.key}
            track={t}
            status={getTrackStatus(t, now)}
            buttonText={TEAM_META[t.key].verb}
            onApply={() => onApplyTeam(t.key)}
          />
        ))}
      </div>
    </div>
  );
};
