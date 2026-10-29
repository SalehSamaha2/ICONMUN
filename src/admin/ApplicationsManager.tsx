import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Mail, RefreshCw, Search, Trash2 } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { APPLICATION_STATUSES, DELEGATION_LABELS, TRACK_LABELS } from './config';
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
}

const TRACK_TABS = [
  { value: 'all', label: 'All' },
  { value: 'delegate', label: 'Delegates' },
  { value: 'volunteer', label: 'Volunteers' },
  { value: 'security', label: 'Security' },
  { value: 'media', label: 'Media' },
];

/** The second column: council for delegates, chosen role for team applications. */
const roleOf = (r: Application) => (r.track === 'delegate' ? r.committee : r.details?.focus || '—');

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = APPLICATION_STATUSES.find((x) => x.value === status);
  return <Badge tone={s?.tone || 'gray'}>{s?.label || status}</Badge>;
};

export const ApplicationsManager: React.FC<{ initialStatus?: string; initialTrack?: string }> = ({ initialStatus = 'all', initialTrack = 'all' }) => {
  const toast = useToast();
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [track, setTrack] = useState(TRACK_TABS.some((t) => t.value === initialTrack) ? initialTrack : 'all');
  const [committee, setCommittee] = useState('all');

  const [openId, setOpenId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState('new');
  const [draftNotes, setDraftNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const { data, error: e } = await sb.from('applications').select('*').order('created_at', { ascending: false }).limit(2000);
      if (e) throw e;
      setRows((data || []) as Application[]);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);
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
    trackRows.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [trackRows]);

  const showCouncilFilter = track === 'all' || track === 'delegate';
  const committees = useMemo(() => Array.from(new Set(rows.filter((r) => r.track === 'delegate').map((r) => r.committee))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trackRows.filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (committee === 'all' || !showCouncilFilter || r.committee === committee) &&
        (!q || [r.full_name, r.email, r.institution, r.first_country, r.committee, r.details?.focus].some((x) => (x || '').toLowerCase().includes(q)))
    );
  }, [trackRows, search, status, committee, showCouncilFilter]);

  const open = rows.find((r) => r.id === openId) || null;
  useEffect(() => {
    if (open) { setDraftStatus(open.status); setDraftNotes(open.internal_notes || ''); }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRow = async (id: string, patch: Partial<Application>) => {
    const sb = await getSupabase()!;
    const { error: e } = await sb.from('applications').update(patch).eq('id', id);
    if (e) throw e;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const quickStatus = async (row: Application, next: string) => {
    try { await updateRow(row.id, { status: next }); toast('ok', `${row.full_name}: ${next}`); }
    catch (e) { toast('err', friendlyError(e)); }
  };

  const saveDetail = async () => {
    if (!open) return;
    setSaving(true);
    try {
      await updateRow(open.id, { status: draftStatus, internal_notes: draftNotes });
      toast('ok', 'Application updated.');
      setOpenId(null);
    } catch (e) { toast('err', friendlyError(e)); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const sb = await getSupabase()!;
      const { error: e } = await sb.from('applications').delete().eq('id', toDelete.id);
      if (e) throw e;
      setRows((rs) => rs.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
      setOpenId(null);
      toast('ok', 'Application deleted.');
    } catch (e) { toast('err', friendlyError(e)); }
    finally { setDeleting(false); }
  };

  const exportCsv = () => {
    const csv = toCsv(
      ['Submitted', 'Track', 'Status', 'Name', 'Email', 'Phone', 'Institution', 'Delegation', 'Council', 'Country preference', 'Experience', 'Team role', 'Availability', 'Message', 'Internal notes'],
      filtered.map((r) => {
        const d = r.track === 'delegate';
        return [r.created_at, TRACK_LABELS[r.track] || r.track, r.status, r.full_name, r.email, r.details?.phone || '', r.institution, d ? DELEGATION_LABELS[r.delegation_type] || r.delegation_type : '', d ? r.committee : '', d ? r.first_country : '', d ? r.experience_level : '', d ? '' : r.details?.focus || '', r.details?.availability || '', r.statement, r.internal_notes];
      })
    );
    downloadCsv(`icon-mun-${track === 'all' ? 'applications' : track}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast('info', `Exported ${filtered.length} application${filtered.length === 1 ? '' : 's'}.`);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Applications"
        subtitle="Everyone who applied, separated by type. Only organisers can see this page."
        actions={
          <>
            <Button variant="subtle" onClick={load}><RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} /> Refresh</Button>
            <Button variant="primary" onClick={exportCsv} disabled={filtered.length === 0}><Download className="h-4 w-4" /> Export CSV</Button>
          </>
        }
      />

      {/* one tab per kind of application */}
      <div className="mb-5 flex flex-wrap gap-1 rounded-2xl border border-[#E8CBA4]/10 bg-[#16080E]/75 p-1.5" role="tablist" aria-label="Application type">
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
      </div>

      {/* status chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[{ value: 'all', label: 'All' }, ...APPLICATION_STATUSES].map((s) => (
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
                  <th className="px-4 py-3 font-medium">Status</th>
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Select value={r.status} onChange={(e) => quickStatus(r, e.target.value)} aria-label={`Status for ${r.full_name}`} className="!w-auto !py-1.5 text-xs">
                        {APPLICATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                  <StatusBadge status={r.status} />
                </div>
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
            <Button variant="danger" size="sm" onClick={() => open && setToDelete(open)}><Trash2 className="h-4 w-4" /> Delete</Button>
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
            {open.statement && (
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#8E8678]">{open.track === 'delegate' ? 'Message from the delegate' : 'Their answer'}</div>
                <p className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-[#E8CBA4]/10 bg-[#12070C] p-4 text-sm leading-7 text-[#F0E8E2]">{open.statement}</p>
              </div>
            )}
            <div>
              <Label htmlFor="app-status">Status</Label>
              <Select id="app-status" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                {APPLICATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <p className="mt-1.5 text-xs text-[#6F685B]">Changing the status does not email the applicant. Contact them yourself.</p>
            </div>
            <div>
              <Label htmlFor="app-notes" hint="Private. Never shown to delegates or on the website.">Internal notes</Label>
              <TextArea id="app-notes" rows={5} value={draftNotes} maxLength={4000} onChange={(e) => setDraftNotes(e.target.value)} />
            </div>
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
