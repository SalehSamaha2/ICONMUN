import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Mail, RefreshCw, Search, Trash2 } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { APPLICATION_STATUSES, DELEGATION_LABELS, TRACK_LABELS } from './config';
import { TEAM_META } from '../lib/tracks';
import { downloadCsv, toCsv } from './csv';
import {
  Badge, Button, Card, ConfirmDialog, Drawer, EmptyState, ErrorBox, Label, PageHeader, Select, Spinner, TextArea,
  cx, formatDate, friendlyError, timeAgo, useToast,
} from './ui';

export interface Application {
  id: string;
  created_at: string;
  delegation_type: string;
  full_name: string;
  institution: string;
  email: string;
  committee: string;
  first_country: string;
  experience_level: string;
  statement: string;
  status: string;
  internal_notes: string;
  track: string;
  details: Record<string, string> | null;
  head_decision: string | null;
  head_decision_by: string | null;
  head_decision_at: string | null;
  head_notes: string;
  proofs: string[] | null;
}

/** Certificate photos the applicant attached. Files are private; each link is a short-lived signed URL. */
const ProofGallery: React.FC<{ paths: string[] }> = ({ paths }) => {
  const [urls, setUrls] = useState<Array<{ path: string; url: string }>>([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    setUrls([]); setErr('');
    (async () => {
      try {
        const sb = await getSupabase()!;
        const { data, error } = await sb.storage.from('application-proofs').createSignedUrls(paths, 600);
        if (error) throw error;
        if (alive) setUrls((data || []).flatMap((d) => (d.signedUrl ? [{ path: d.path || '', url: d.signedUrl }] : [])));
      } catch (e) { if (alive) setErr(friendlyError(e)); }
    })();
    return () => { alive = false; };
  }, [paths.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#8E8678]">Certificates and proof ({paths.length})</div>
      {err ? <p className="mt-2 text-xs text-rose-300">{err}</p> : (
        <div className="mt-2 flex flex-wrap gap-3">
          {paths.map((p, i) => {
            const u = urls.find((x) => x.path === p);
            return u ? (
              <a key={p} href={u.url} target="_blank" rel="noopener noreferrer" className="block h-24 w-24 overflow-hidden rounded-lg border border-[#E8CBA4]/25 bg-black/30 transition-opacity hover:opacity-80" title="Open full size">
                <img src={u.url} alt={`Certificate ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </a>
            ) : <div key={p} className="h-24 w-24 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
          })}
        </div>
      )}
    </section>
  );
};

const TRACK_TABS = [
  { value: 'all', label: 'All' },
  { value: 'delegate', label: 'Delegates' },
  { value: 'volunteer', label: 'Volunteers' },
  { value: 'security', label: 'Security' },
  { value: 'media', label: 'Media' },
];

/** The second column: council for delegates, chosen role for team applications. */
const roleOf = (r: Application) => (r.track === 'delegate' ? r.committee : r.details?.focus || '—');

/** Rebuild team answers from the exact prompt/answer text saved at submission time.
 * If a legacy or malformed record cannot be matched safely, show the raw text instead. */
const getTeamAnswers = (r: Application) => {
  if (r.track === 'delegate' || !(r.track in TEAM_META)) return null;
  const questions = TEAM_META[r.track as keyof typeof TEAM_META].questions;
  const source = (r.statement || '') + (r.details?.statement_overflow || '');
  const positions = questions.map((q) => source.indexOf(`${q.prompt}\n`));
  if (positions.some((position) => position < 0)) return null;
  return questions.map((q, index) => {
    const start = positions[index] + q.prompt.length + 1;
    const nextPosition = positions[index + 1];
    const end = nextPosition >= 0 ? nextPosition : source.length;
    return { prompt: q.prompt, answer: source.slice(start, end).replace(/\n+$/, '') };
  });
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = APPLICATION_STATUSES.find((x) => x.value === status);
  return <Badge tone={s?.tone || 'gray'}>{s?.label || status}</Badge>;
};

const HeadDecision: React.FC<{ r: Application; compact?: boolean }> = ({ r, compact }) =>
  r.head_decision ? (
    <span className="inline-flex flex-col gap-0.5 align-top">
      <StatusBadge status={r.head_decision} />
      {!compact && r.head_decision_by && <span className="text-[10px] text-[#8E8678]">{r.head_decision_by}{r.head_decision_at ? ` · ${timeAgo(r.head_decision_at)}` : ''}</span>}
    </span>
  ) : <span className="text-xs text-[#6F685B]">{r.track === 'delegate' ? 'n/a' : '—'}</span>;

/** The head's own verdict. 'new' (no verdict yet) is stored as null. */
const HEAD_OPTIONS = [
  { value: 'new', label: 'No decision yet' },
  { value: 'reviewing', label: 'Under review' },
  { value: 'accepted', label: 'Accept' },
  { value: 'waitlisted', label: 'Waitlist' },
  { value: 'rejected', label: 'Reject' },
];

export const ApplicationsManager: React.FC<{ initialStatus?: string; initialTrack?: string; headTrack?: string }> = ({ initialStatus = 'all', initialTrack = 'all', headTrack }) => {
  const toast = useToast();
  const isHead = !!headTrack;
  /** What the status chips, column and quick-select work on: the head's own verdict for heads, the final status for the SG. */
  const stateOf = (r: Application) => (isHead ? r.head_decision || 'new' : r.status);
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [track, setTrack] = useState(headTrack || (TRACK_TABS.some((t) => t.value === initialTrack) ? initialTrack : 'all'));
  const [committee, setCommittee] = useState('all');

  const [openId, setOpenId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState('new');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftHead, setDraftHead] = useState('new');
  const [draftHeadNotes, setDraftHeadNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      let q = sb.from('applications').select('*').order('created_at', { ascending: false }).limit(2000);
      if (headTrack) q = q.eq('track', headTrack); // the database enforces this too
      const { data, error: e } = await q;
      if (e) throw e;
      setRows((data || []) as Application[]);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [headTrack]);
  useEffect(() => { load(); }, [load]);

  const trackRows = useMemo(() => (track === 'all' ? rows : rows.filter((r) => r.track === track)), [rows, track]);

  const trackCounts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    rows.forEach((r) => (c[r.track] = (c[r.track] || 0) + 1));
    return c;
  }, [rows]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: trackRows.length };
    APPLICATION_STATUSES.forEach((s) => (c[s.value] = 0));
    trackRows.forEach((r) => { const k = isHead ? r.head_decision || 'new' : r.status; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [trackRows, isHead]);

  const showCouncilFilter = !isHead && (track === 'all' || track === 'delegate');
  const committees = useMemo(() => Array.from(new Set(rows.filter((r) => r.track === 'delegate').map((r) => r.committee))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trackRows.filter(
      (r) =>
        (status === 'all' || (isHead ? r.head_decision || 'new' : r.status) === status) &&
        (committee === 'all' || !showCouncilFilter || r.committee === committee) &&
        (!q || [r.full_name, r.email, r.institution, r.first_country, r.committee, r.details?.focus].some((x) => (x || '').toLowerCase().includes(q)))
    );
  }, [trackRows, search, status, committee, showCouncilFilter]);

  const open = rows.find((r) => r.id === openId) || null;
  useEffect(() => {
    if (open) {
      setDraftStatus(open.status); setDraftNotes(open.internal_notes || '');
      setDraftHead(open.head_decision || 'new'); setDraftHeadNotes(open.head_notes || '');
    }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRow = async (id: string, patch: Partial<Application>) => {
    const sb = await getSupabase()!;
    const { data, error: e } = await sb.from('applications').update(patch).eq('id', id).select('*').maybeSingle();
    if (e) throw e;
    if (!data) throw new Error('You do not have permission to change this application.');
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...(data as Application) } : r)));
  };

  const headValue = (v: string) => (v === 'new' ? null : v);

  const quickStatus = async (row: Application, next: string) => {
    try {
      await updateRow(row.id, isHead ? { head_decision: headValue(next) } : { status: next });
      toast('ok', `${row.full_name}: ${next}`);
    }
    catch (e) { toast('err', friendlyError(e)); }
  };

  const saveDetail = async () => {
    if (!open) return;
    setSaving(true);
    try {
      await updateRow(open.id, isHead
        ? { head_decision: headValue(draftHead), head_notes: draftHeadNotes }
        : { status: draftStatus, internal_notes: draftNotes });
      toast('ok', 'Application updated.');
      setOpenId(null);
    } catch (e) { toast('err', friendlyError(e)); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!toDelete || isHead) return;
    setDeleting(true);
    try {
      const sb = await getSupabase()!;
      const { error: e } = await sb.from('applications').delete().eq('id', toDelete.id);
      if (e) throw e;
      // also remove the applicant's certificate images (best effort)
      if (toDelete.proofs?.length) await sb.storage.from('application-proofs').remove(toDelete.proofs).catch(() => undefined);
      setRows((rs) => rs.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
      setOpenId(null);
      toast('ok', 'Application deleted.');
    } catch (e) { toast('err', friendlyError(e)); }
    finally { setDeleting(false); }
  };

  const exportCsv = () => {
    const csv = toCsv(
      ['Submitted', 'Track', isHead ? 'Your decision' : 'Final status', 'Name', 'Email', 'Phone', 'Institution', 'Delegation', 'Council', 'Country preference', 'Experience', 'Team role', 'Availability', 'Message', ...(isHead ? ['Your notes'] : ["Head's decision", "Head's notes", 'Internal notes'])],
      filtered.map((r) => {
        const d = r.track === 'delegate';
        return [r.created_at, TRACK_LABELS[r.track] || r.track, isHead ? r.head_decision || '' : r.status, r.full_name, r.email, r.details?.phone || '', r.institution, d ? DELEGATION_LABELS[r.delegation_type] || r.delegation_type : '', d ? r.committee : '', d ? r.first_country : '', d ? r.experience_level : '', d ? '' : r.details?.focus || '', r.details?.availability || '', r.statement + (r.details?.statement_overflow || ''), ...(isHead ? [r.head_notes] : [r.head_decision || '', r.head_notes, r.internal_notes])];
      })
    );
    downloadCsv(`icon-mun-${track === 'all' ? 'applications' : track}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast('info', `Exported ${filtered.length} application${filtered.length === 1 ? '' : 's'}.`);
  };

  return (
    <div>
      <PageHeader
        eyebrow={isHead ? 'Your track' : 'Registry'}
        title={isHead ? `${TRACK_LABELS[headTrack!] || headTrack} applications` : 'Applications'}
        subtitle={isHead
          ? 'Review the people who applied to your team. Your decision is a recommendation: the Secretary-General confirms the final result.'
          : 'Everyone who applied, separated by type. Each head\'s recommendation is shown next to the final status you set.'}
        actions={
          <>
            <Button variant="subtle" onClick={load}><RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} /> Refresh</Button>
            <Button variant="primary" onClick={exportCsv} disabled={filtered.length === 0}><Download className="h-4 w-4" /> Export CSV</Button>
          </>
        }
      />

      {/* one tab per kind of application */}
      {!isHead && <div className="mb-5 flex flex-wrap gap-1 rounded-2xl border border-[#E8CBA4]/10 bg-[#16080E]/75 p-1.5" role="tablist" aria-label="Application type">
        {TRACK_TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={track === t.value}
            onClick={() => { setTrack(t.value); setCommittee('all'); }}
            className={cx(
              'cursor-pointer rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-200',
              track === t.value ? 'border-[#E8CBA4]/15 bg-[#E8CBA4]/[0.09] text-[#FFF5E8] shadow-sm' : 'text-[#B59B9F] hover:bg-white/[0.04] hover:text-[#FFF5E8]'
            )}
          >
            {t.label} <span className="ml-1 text-xs opacity-60">{trackCounts[t.value] ?? 0}</span>
          </button>
        ))}
      </div>}

      {/* status chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[{ value: 'all', label: 'All' }, ...(isHead ? HEAD_OPTIONS.map((o) => ({ ...o, label: o.value === 'new' ? 'Undecided' : o.label })) : APPLICATION_STATUSES)].map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium tracking-wide transition-all duration-200',
              status === s.value ? 'border-[#E8CBA4]/50 bg-[#E8CBA4]/[0.10] text-[#FFF5E8]' : 'border-white/[0.09] bg-white/[0.02] text-[#B59B9F] hover:border-[#E8CBA4]/30'
            )}
          >
            {s.label} <span className="ml-1 opacity-60">{counts[s.value] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className={cx('mb-4 grid grid-cols-1 gap-3', showCouncilFilter && 'sm:grid-cols-[1fr_220px]')}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F685B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, school, country…"
            aria-label="Search applications"
            className="w-full rounded-xl border border-[#E8CBA4]/15 bg-[#16080E] py-3 pl-10 pr-3.5 text-sm text-[#FFF5E8] placeholder-[#8D737A] transition-all duration-200 focus:border-[#E8CBA4]/60 focus:outline-none focus:ring-4 focus:ring-[#E8CBA4]/[0.08]"
          />
        </div>
        {showCouncilFilter && (
          <Select value={committee} onChange={(e) => setCommittee(e.target.value)} aria-label="Filter by council">
            <option value="all">All councils</option>
            {committees.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        )}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : filtered.length === 0 ? (
        <Card><EmptyState title={rows.length === 0 ? 'No applications yet' : 'Nothing matches those filters'} hint={rows.length === 0 ? 'When someone submits a form on the website, they appear here.' : 'Try clearing the search or the status filter.'} /></Card>
      ) : (
        <Card className="overflow-hidden">
          {/* desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.018] text-[10px] uppercase tracking-[0.16em] text-[#B59B9F]">
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">{track === 'delegate' ? 'Council' : track === 'all' ? 'Type · council / role' : 'Role'}</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  {!isHead && <th className="px-4 py-3 font-medium">Head's decision</th>}
                  <th className="px-4 py-3 font-medium">{isHead ? 'Your decision' : 'Final status'}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((r) => (
                  <tr key={r.id} className="cursor-pointer transition-colors duration-150 hover:bg-[#E8CBA4]/[0.045] focus-within:bg-[#E8CBA4]/[0.045]" onClick={() => setOpenId(r.id)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#F4EFE6]">{r.full_name}</div>
                      <div className="text-xs text-[#8E8678]">{r.email} · {r.institution || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-[#C4BAA8]">{track === 'all' && <span className="mr-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#8E8678]">{TRACK_LABELS[r.track] || r.track}</span>}{roleOf(r)}</td>
                    <td className="px-4 py-3 text-xs text-[#8E8678]" title={formatDate(r.created_at)}>{timeAgo(r.created_at)}</td>
                    {!isHead && <td className="px-4 py-3"><HeadDecision r={r} /></td>}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Select value={stateOf(r)} onChange={(e) => quickStatus(r, e.target.value)} aria-label={`${isHead ? 'Your decision' : 'Status'} for ${r.full_name}`} className="!w-auto !py-1.5 text-xs">
                        {(isHead ? HEAD_OPTIONS : APPLICATION_STATUSES).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-[#D4AF6A]">Open →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile cards */}
          <div className="divide-y divide-white/5 md:hidden">
            {filtered.map((r) => (
              <button key={r.id} className="block w-full cursor-pointer px-4 py-3.5 text-left" onClick={() => setOpenId(r.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#F4EFE6]">{r.full_name}</div>
                    <div className="truncate text-xs text-[#8E8678]">{r.email}</div>
                  </div>
                  <StatusBadge status={stateOf(r)} />
                </div>
                {!isHead && r.head_decision && <div className="mt-1 text-[11px] text-[#B59B9F]">Head: <HeadDecision r={r} compact /></div>}
                <div className="mt-1.5 text-xs text-[#6F685B]">{(TRACK_LABELS[r.track] || r.track)} · {roleOf(r)} · {timeAgo(r.created_at)}</div>
              </button>
            ))}
          </div>
          <div className="border-t border-white/[0.08] bg-white/[0.015] px-4 py-3 text-xs text-[#8D737A]">Showing {filtered.length} of {rows.length}</div>
        </Card>
      )}

      <Drawer
        open={!!open}
        onClose={() => !saving && setOpenId(null)}
        title={open?.full_name || ''}
        subtitle={open ? `Submitted ${formatDate(open.created_at)}` : ''}
        footer={
          <div className="flex items-center justify-between gap-3">
            {isHead ? <span /> : <Button variant="danger" size="sm" onClick={() => open && setToDelete(open)}><Trash2 className="h-4 w-4" /> Delete</Button>}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpenId(null)} disabled={saving}>Close</Button>
              <Button variant="primary" loading={saving} onClick={saveDetail}>Save</Button>
            </div>
          </div>
        }
      >
        {open && (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                ['Type', TRACK_LABELS[open.track] || open.track],
                ['Email', <a key="m" href={`mailto:${open.email}`} className="inline-flex items-center gap-1.5 text-[#F3DFA2] underline-offset-2 hover:underline"><Mail className="h-3.5 w-3.5" />{open.email}</a>],
                ['School / institution', open.institution || '—'],
                ...(open.track === 'delegate'
                  ? [
                      ['Delegation', DELEGATION_LABELS[open.delegation_type] || open.delegation_type],
                      ['Council preference', open.committee],
                      ['Country preference', open.first_country],
                      ['Experience', open.experience_level],
                    ]
                  : [
                      ['Role / specialty', open.details?.focus || '—'],
                      ['Phone', open.details?.phone || '—'],
                      ['Availability', open.details?.availability || '—'],
                    ]),
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-[#8E8678]">{k}</dt>
                  <dd className="mt-1 break-words text-sm text-[#F4EFE6]">{v}</dd>
                </div>
              ))}
            </dl>
            {open.track === 'delegate' ? (
              open.statement && (
                <section className="space-y-2">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF6A]">Delegate statement</div>
                  <div className="rounded-xl border border-[#E8CBA4]/15 bg-[#12070C] p-4">
                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#F0E8E2]">{open.statement}{open.details?.statement_overflow || ''}</p>
                  </div>
                </section>
              )
            ) : (() => {
              const answers = getTeamAnswers(open);
              const hasSavedText = !!(open.statement || open.details?.statement_overflow);
              return hasSavedText ? (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF6A]">Written application answers</div>
                    <span className="text-[10px] text-[#8E8678]">{answers ? `${answers.length} questions · original submitted text` : 'Saved submission text'}</span>
                  </div>
                  {answers ? answers.map((item, index) => (
                    <article key={index} className="overflow-hidden rounded-xl border border-[#E8CBA4]/15 bg-[#12070C]">
                      <div className="flex items-start gap-3 border-b border-[#E8CBA4]/10 bg-white/[0.025] px-4 py-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D4AF6A]/35 text-[11px] font-semibold text-[#D4AF6A]">{index + 1}</span>
                        <h4 className="pt-0.5 text-sm font-medium leading-6 text-[#F3DFA2]">{item.prompt}</h4>
                      </div>
                      <div className="px-4 py-4">
                        <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8E8678]">Applicant's answer</div>
                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#F0E8E2]">{item.answer || <span className="italic text-[#8E8678]">No answer text was saved for this question.</span>}</p>
                      </div>
                    </article>
                  )) : (
                    <div className="rounded-xl border border-[#E8CBA4]/15 bg-[#12070C] p-4">
                      <p className="mb-2 text-xs text-[#D4AF6A]">This older submission does not match the current question format, so it is shown without guessing which answer belongs to which question.</p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#F0E8E2]">{open.statement}{open.details?.statement_overflow || ''}</p>
                    </div>
                  )}
                  <p className="text-[10px] leading-5 text-[#8E8678]">These are the text responses stored from the submitted form. Leading and trailing whitespace was trimmed when the application was submitted; the answer wording is otherwise displayed from the saved record.</p>
                </section>
              ) : null;
            })()}
            {open.proofs && open.proofs.length > 0 && <ProofGallery paths={open.proofs} />}
            {isHead ? (
              <>
                <div>
                  <Label htmlFor="head-decision">Your decision</Label>
                  <Select id="head-decision" value={draftHead} onChange={(e) => setDraftHead(e.target.value)}>
                    {HEAD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  <p className="mt-1.5 text-xs text-[#6F685B]">This is your recommendation. The Secretary-General confirms the final status, and the applicant is not emailed.{open.head_decision_at && <> Last set {timeAgo(open.head_decision_at)}{open.head_decision_by ? ` by ${open.head_decision_by}` : ''}.</>}</p>
                </div>
                <div>
                  <Label htmlFor="head-notes" hint="Visible to you, the other heads of this track and the Secretary-General.">Your notes</Label>
                  <TextArea id="head-notes" rows={5} value={draftHeadNotes} maxLength={4000} onChange={(e) => setDraftHeadNotes(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                {open.track !== 'delegate' && (
                  <div className="rounded-xl border border-[#E8CBA4]/15 bg-[#12070C] p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#8E8678]">Head's decision</div>
                    {open.head_decision ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#F0E8E2]"><StatusBadge status={open.head_decision} /> <span className="text-xs text-[#8E8678]">{open.head_decision_by || 'a head'}{open.head_decision_at ? ` · ${timeAgo(open.head_decision_at)}` : ''}</span></div>
                    ) : <p className="mt-2 text-sm text-[#8E8678]">The head has not decided yet.</p>}
                    {open.head_notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#F0E8E2]">{open.head_notes}</p>}
                  </div>
                )}
                <div>
                  <Label htmlFor="app-status">Final status</Label>
                  <Select id="app-status" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                    {APPLICATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>
                  <p className="mt-1.5 text-xs text-[#6F685B]">Changing the status does not email the applicant. Contact them yourself.</p>
                </div>
                <div>
                  <Label htmlFor="app-notes" hint="Private. Never shown to delegates, heads or on the website.">Internal notes</Label>
                  <TextArea id="app-notes" rows={5} value={draftNotes} maxLength={4000} onChange={(e) => setDraftNotes(e.target.value)} />
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this application?"
        message={<><strong className="text-[#F4EFE6]">{toDelete?.full_name}</strong> ({toDelete?.email}) will be permanently removed. Export a CSV first if you might need it.</>}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};
