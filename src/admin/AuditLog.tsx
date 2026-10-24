import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader, Select, Spinner, formatDate, friendlyError } from './ui';

interface Entry { id: number; at: string; user_email: string | null; table_name: string; op: string; summary: string | null }

const TABLE_LABELS: Record<string, string> = {
  committees: 'Council', schedule_days: 'Schedule day', schedule_events: 'Schedule event', secretariat: 'Secretariat',
  settings: 'Setting', applications: 'Application', admins: 'Organiser',
};
const OP_TONE = { INSERT: 'green', UPDATE: 'gold', DELETE: 'red' } as const;
const OP_LABEL = { INSERT: 'Added', UPDATE: 'Edited', DELETE: 'Deleted' } as const;

export const AuditLog: React.FC = () => {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [table, setTable] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const { data, error: e } = await sb.from('audit_log').select('id,at,user_email,table_name,op,summary').order('at', { ascending: false }).limit(300);
      if (e) throw e;
      setRows((data || []) as Entry[]);
    } catch (e) { setError(friendlyError(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => rows.filter((r) => table === 'all' || r.table_name === table), [rows, table]);

  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Activity log"
        subtitle="Who changed what, and when. Written automatically by the database; nobody can edit or delete these entries from the website."
        actions={<Button variant="subtle" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />
      <div className="mb-4 max-w-xs">
        <Select value={table} onChange={(e) => setTable(e.target.value)} aria-label="Filter by area">
          <option value="all">All areas</option>
          {Object.entries(TABLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : shown.length === 0 ? (
        <Card><EmptyState title="No activity yet" hint="Edits made in this panel will be listed here." /></Card>
      ) : (
        <Card className="divide-y divide-white/5 overflow-hidden">
          {shown.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <Badge tone={OP_TONE[r.op as keyof typeof OP_TONE] || 'gray'}>{OP_LABEL[r.op as keyof typeof OP_LABEL] || r.op}</Badge>
              <span className="text-[#C4BAA8]">{TABLE_LABELS[r.table_name] || r.table_name}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-[#F4EFE6]">{r.summary || '—'}</span>
              <span className="text-xs text-[#8E8678]">{r.user_email || 'unknown'} · {formatDate(r.at)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
