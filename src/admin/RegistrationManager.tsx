import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Camera, HeartHandshake, Landmark, ShieldCheck, type LucideIcon } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { getTrackStatus, type TrackStatus } from '../lib/tracks';
import type { TrackItem, TrackKey } from '../data/defaults';
import { TRACK_LABELS } from './config';
import { Button, Card, ErrorBox, Label, PageHeader, Spinner, TextInput, Toggle, cx, friendlyError, useToast } from './ui';

const ICONS: Record<TrackKey, LucideIcon> = { delegate: Landmark, volunteer: HeartHandshake, security: ShieldCheck, media: Camera };

interface Row {
  key: TrackKey;
  title: string;
  description: string;
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  closed_label: string;
  sort_order: number;
}

const toItem = (r: Row): TrackItem => ({
  key: r.key,
  title: r.title,
  description: r.description,
  isOpen: r.is_open,
  opensAt: r.opens_at,
  closesAt: r.closes_at,
  closedLabel: r.closed_label,
});

// <input type="datetime-local"> works in the organiser's own time zone
const isoToLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const localToIso = (v: string) => (v ? new Date(v).toISOString() : null);

const Pill: React.FC<{ status: TrackStatus }> = ({ status }) => {
  const tone =
    status.state === 'open'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : status.state === 'upcoming'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : 'border-white/10 bg-white/5 text-[#A89D8A]';
  const dot = status.state === 'open' ? 'bg-emerald-300' : status.state === 'upcoming' ? 'bg-amber-300' : 'bg-rose-300/70';
  return (
    <span role="status" className={cx('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium', tone)}>
      <span className={cx('h-2 w-2 rounded-full', dot)} />
      {status.label}
    </span>
  );
};

const TrackCard: React.FC<{
  row: Row;
  count: number;
  primary?: boolean;
  go: (route: string) => void;
  onSaved: (r: Row) => void;
}> = ({ row, count, primary, go, onSaved }) => {
  const toast = useToast();
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(row), [row]);

  const Icon = ICONS[row.key];
  const status = getTrackStatus(toItem(draft));
  const liveStatus = getTrackStatus(toItem(row));
  const dirty =
    draft.opens_at !== row.opens_at || draft.closes_at !== row.closes_at || draft.closed_label !== row.closed_label || draft.description !== row.description;

  const persist = async (patch: Partial<Row>, okMsg: string) => {
    setSaving(true);
    try {
      const sb = await getSupabase()!;
      const { data, error } = await sb.from('registration_tracks').update(patch).eq('key', row.key).select().single();
      if (error) throw error;
      onSaved(data as Row);
      toast('ok', okMsg);
    } catch (e) {
      toast('err', friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const toggle = (next: boolean) =>
    persist({ is_open: next }, next ? `${TRACK_LABELS[row.key]} applications are switched on.` : `${TRACK_LABELS[row.key]} applications are switched off.`);

  const save = () => {
    if (draft.opens_at && draft.closes_at && new Date(draft.closes_at) <= new Date(draft.opens_at)) {
      return toast('err', 'The closing time must be after the opening time.');
    }
    persist(
      {
        opens_at: draft.opens_at,
        closes_at: draft.closes_at,
        closed_label: draft.closed_label.trim() || 'Closed',
        description: draft.description.trim(),
      },
      'Saved.'
    );
  };

  return (
    <Card className={cx('p-5 sm:p-6', primary && 'border-[#D4AF6A]/35')}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={cx('flex shrink-0 items-center justify-center rounded-xl border', primary ? 'h-14 w-14' : 'h-12 w-12', liveStatus.state === 'open' ? 'border-[#D4AF6A]/40 text-[#D4AF6A]' : 'border-white/10 text-[#6F685B]')}>
            <Icon className={primary ? 'h-7 w-7' : 'h-6 w-6'} />
          </div>
          <div className="min-w-0">
            <h2 className="font-cinzel text-lg font-semibold text-[#FFF3D6]">{TRACK_LABELS[row.key]}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Pill status={liveStatus} />
              {liveStatus.detail && <span className="text-xs text-[#8E8678]">{liveStatus.detail}</span>}
            </div>
            <button
              onClick={() => go(`applications?track=${row.key}`)}
              className="mt-2.5 inline-flex cursor-pointer items-center gap-1 text-xs text-[#F3DFA2] hover:underline"
            >
              {count} application{count === 1 ? '' : 's'} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:pt-1">
          <span className="text-sm text-[#C4BAA8]">Accepting applications</span>
          <Toggle checked={row.is_open} onChange={toggle} label={`${TRACK_LABELS[row.key]} applications on or off`} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
        <div>
          <Label htmlFor={`o-${row.key}`} hint="Optional. Before this moment the site shows “Opens soon”.">Opens at</Label>
          <div className="flex gap-2">
            <TextInput id={`o-${row.key}`} type="datetime-local" value={isoToLocal(draft.opens_at)} onChange={(e) => setDraft((d) => ({ ...d, opens_at: localToIso(e.target.value) }))} />
            {draft.opens_at && <Button variant="ghost" size="sm" onClick={() => setDraft((d) => ({ ...d, opens_at: null }))}>Clear</Button>}
          </div>
        </div>
        <div>
          <Label htmlFor={`c-${row.key}`} hint="Optional. After this moment it closes automatically.">Closes at</Label>
          <div className="flex gap-2">
            <TextInput id={`c-${row.key}`} type="datetime-local" value={isoToLocal(draft.closes_at)} onChange={(e) => setDraft((d) => ({ ...d, closes_at: localToIso(e.target.value) }))} />
            {draft.closes_at && <Button variant="ghost" size="sm" onClick={() => setDraft((d) => ({ ...d, closes_at: null }))}>Clear</Button>}
          </div>
        </div>
        <div>
          <Label htmlFor={`l-${row.key}`} hint="What visitors see when it is closed, e.g. Closed or Full.">Closed message</Label>
          <TextInput id={`l-${row.key}`} maxLength={30} value={draft.closed_label} placeholder="Closed" onChange={(e) => setDraft((d) => ({ ...d, closed_label: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor={`d-${row.key}`} hint="One line shown on the website card.">Description</Label>
          <TextInput id={`d-${row.key}`} maxLength={300} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#6F685B]">
          On the website now: <span className="text-[#C4BAA8]">{liveStatus.label}</span>
          {dirty && <> · after saving: <span className="text-[#F3DFA2]">{status.label}</span></>}
        </p>
        <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}>Save changes</Button>
      </div>
    </Card>
  );
};

export const RegistrationManager: React.FC<{ go: (route: string) => void }> = ({ go }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const [t, a] = await Promise.all([
        sb.from('registration_tracks').select('*').order('sort_order'),
        sb.from('applications').select('track').limit(5000),
      ]);
      if (t.error) throw t.error;
      if (a.error) throw a.error;
      setRows((t.data || []) as Row[]);
      const c: Record<string, number> = {};
      (a.data || []).forEach((r: { track: string }) => (c[r.track] = (c[r.track] || 0) + 1));
      setCounts(c);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const byKey = useMemo(() => new Map(rows.map((r) => [r.key, r])), [rows]);
  const onSaved = (r: Row) => setRows((rs) => rs.map((x) => (x.key === r.key ? r : x)));
  const delegate = byKey.get('delegate');
  const team = (['volunteer', 'security', 'media'] as const).map((k) => byKey.get(k)).filter(Boolean) as Row[];

  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Registration"
        subtitle={`Switch delegate registration and each team application on or off, and optionally schedule when they open and close. Times use your computer's time zone (${Intl.DateTimeFormat().resolvedOptions().timeZone}).`}
      />
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : rows.length === 0 ? (
        <ErrorBox message="The registration_tracks table is empty or missing. Run supabase/team_applications.sql in the Supabase SQL Editor, then refresh." onRetry={load} />
      ) : (
        <div className="space-y-4">
          {delegate && <TrackCard row={delegate} count={counts.delegate || 0} primary go={go} onSaved={onSaved} />}

          <div className="flex items-center gap-4 py-4" role="separator" aria-label="Team applications">
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-cinzel text-sm text-[#C4BAA8]">Team applications</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            {team.map((r) => <TrackCard key={r.key} row={r} count={counts[r.key] || 0} go={go} onSaved={onSaved} />)}
          </div>
        </div>
      )}
    </div>
  );
};
