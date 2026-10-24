import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { RESOURCES, type FieldDef, type ResourceDef } from './config';
import { FileUpload } from './FileUpload';
import {
  Badge, Button, Card, ConfirmDialog, Drawer, EmptyState, ErrorBox, Label, PageHeader, Select, Spinner,
  TextArea, TextInput, Toggle, cx, friendlyError, useToast,
} from './ui';

type Row = Record<string, any>;
type FormValues = Record<string, any>;

const toFormValues = (res: ResourceDef, row: Row): FormValues => {
  const v: FormValues = {};
  for (const f of res.fields) {
    const raw = row[f.name];
    v[f.name] = f.type === 'list' ? (Array.isArray(raw) ? raw.join('\n') : '') : raw ?? (f.type === 'boolean' ? false : '');
  }
  v.is_published = row.is_published ?? true;
  return v;
};

const toPayload = (res: ResourceDef, v: FormValues): Row => {
  const p: Row = {};
  for (const f of res.fields) {
    const raw = v[f.name];
    if (f.type === 'list') p[f.name] = String(raw || '').split('\n').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'number') p[f.name] = Number(raw);
    else if (f.type === 'boolean') p[f.name] = !!raw;
    else p[f.name] = typeof raw === 'string' ? raw.trim() : raw;
  }
  p.is_published = !!v.is_published;
  return p;
};

export const ContentManager: React.FC<{ resourceKey: string }> = ({ resourceKey }) => {
  const res = RESOURCES.find((r) => r.key === resourceKey)!;
  const toast = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [groups, setGroups] = useState<Row[]>([]); // for grouped resources (events -> days)
  const [relations, setRelations] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState<{ id?: string; values: FormValues } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const q = await sb.from(res.table).select('*').order('sort_order', { ascending: true });
      if (q.error) throw q.error;
      setRows(q.data || []);

      const rel: Record<string, Row[]> = {};
      for (const f of res.fields.filter((x) => x.type === 'relation' && x.relation)) {
        const r = await sb.from(f.relation!.table).select('*').order(f.relation!.orderBy, { ascending: true });
        if (r.error) throw r.error;
        rel[f.name] = r.data || [];
      }
      setRelations(rel);
      if (res.groupBy) {
        const g = await sb.from(res.groupBy.table).select('*').order(res.groupBy.orderBy, { ascending: true });
        if (g.error) throw g.error;
        setGroups(g.data || []);
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [res]);

  useEffect(() => {
    setEditing(null);
    load();
  }, [load]);

  /* rows arranged for display: [{ key, label, items }] */
  const sections = useMemo(() => {
    if (!res.groupBy) return [{ key: 'all', label: '', items: rows }];
    const gb = res.groupBy;
    const out = groups.map((g) => ({ key: g.id as string, label: String(g[gb.labelField] || 'Untitled day'), items: rows.filter((r) => r[gb.field] === g.id) }));
    const known = new Set(groups.map((g) => g.id));
    const orphans = rows.filter((r) => !known.has(r[gb.field]));
    if (orphans.length) out.push({ key: 'orphans', label: 'No day', items: orphans });
    return out;
  }, [rows, groups, res]);

  /* ---------------------------------------------------------------- actions */
  const openNew = (groupId?: string) => {
    const values = toFormValues(res, { ...res.defaults });
    if (res.groupBy && groupId) values[res.groupBy.field] = groupId;
    if (res.key === 'schedule_days') values.day_number = rows.length + 1;
    setFormError('');
    setEditing({ values });
  };

  const openEdit = (row: Row) => {
    setFormError('');
    setEditing({ id: row.id, values: toFormValues(res, row) });
  };

  const validate = (v: FormValues): string => {
    for (const f of res.fields) {
      const raw = v[f.name];
      if (f.required && (raw === '' || raw === null || raw === undefined || (typeof raw === 'string' && !raw.trim()))) return `"${f.label}" is required.`;
      if (f.maxLength && typeof raw === 'string' && raw.length > f.maxLength) return `"${f.label}" is too long (max ${f.maxLength} characters).`;
      if (f.type === 'number' && raw !== '' && !Number.isFinite(Number(raw))) return `"${f.label}" must be a number.`;
    }
    return '';
  };

  const save = async () => {
    if (!editing) return;
    const problem = validate(editing.values);
    if (problem) return setFormError(problem);
    setSaving(true);
    setFormError('');
    try {
      const sb = await getSupabase()!;
      const payload = toPayload(res, editing.values);
      if (editing.id) {
        const { error: e } = await sb.from(res.table).update(payload).eq('id', editing.id);
        if (e) throw e;
        toast('ok', `Saved ${res.singular}.`);
      } else {
        const peers = res.groupBy ? rows.filter((r) => r[res.groupBy!.field] === payload[res.groupBy!.field]) : rows;
        payload.sort_order = peers.reduce((m, r) => Math.max(m, r.sort_order || 0), 0) + 10;
        const { error: e } = await sb.from(res.table).insert(payload);
        if (e) throw e;
        toast('ok', `Added ${res.singular}.`);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (row: Row) => {
    const next = !row.is_published;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_published: next } : r)));
    try {
      const sb = await getSupabase()!;
      const { error: e } = await sb.from(res.table).update({ is_published: next }).eq('id', row.id);
      if (e) throw e;
      toast('ok', next ? 'Published on the site.' : 'Hidden from the site.');
    } catch (e) {
      toast('err', friendlyError(e));
      load();
    }
  };

  const move = async (items: Row[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const updates = reordered.map((r, i) => ({ id: r.id, sort_order: (i + 1) * 10 })).filter((u, i) => reordered[i].sort_order !== u.sort_order);
    const orderMap = new Map(reordered.map((r, i) => [r.id, (i + 1) * 10]));
    setRows((rs) => rs.map((r) => (orderMap.has(r.id) ? { ...r, sort_order: orderMap.get(r.id) } : r)).sort((a, b) => a.sort_order - b.sort_order));
    try {
      const sb = await getSupabase()!;
      const results = await Promise.all(updates.map((u) => sb.from(res.table).update({ sort_order: u.sort_order }).eq('id', u.id)));
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    } catch (e) {
      toast('err', friendlyError(e));
      load();
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const sb = await getSupabase()!;
      const { error: e } = await sb.from(res.table).delete().eq('id', toDelete.id);
      if (e) throw e;
      toast('ok', `Deleted ${res.singular}.`);
      setToDelete(null);
      await load();
    } catch (e) {
      toast('err', friendlyError(e));
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------------------------------------------------------- render */
  const setValue = (name: string, value: any) => setEditing((ed) => (ed ? { ...ed, values: { ...ed.values, [name]: value } } : ed));

  const renderField = (f: FieldDef) => {
    const id = `f-${f.name}`;
    const v = editing!.values[f.name];
    let control: React.ReactNode;
    switch (f.type) {
      case 'textarea':
        control = <TextArea id={id} value={v} maxLength={f.maxLength} onChange={(e) => setValue(f.name, e.target.value)} placeholder={f.placeholder} />;
        break;
      case 'list':
        control = <TextArea id={id} value={v} rows={4} onChange={(e) => setValue(f.name, e.target.value)} placeholder="One item per line" />;
        break;
      case 'number':
        control = <TextInput id={id} type="number" value={v} onChange={(e) => setValue(f.name, e.target.value)} />;
        break;
      case 'boolean':
        control = (
          <div className="flex h-[42px] items-center gap-3">
            <Toggle id={id} checked={!!v} onChange={(x) => setValue(f.name, x)} label={f.label} />
            <span className="text-sm text-[#A89D8A]">{v ? 'Yes' : 'No'}</span>
          </div>
        );
        break;
      case 'select':
        control = (
          <Select id={id} value={v} onChange={(e) => setValue(f.name, e.target.value)}>
            {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        );
        break;
      case 'relation':
        control = (
          <Select id={id} value={v} onChange={(e) => setValue(f.name, e.target.value)}>
            <option value="">Select…</option>
            {(relations[f.name] || []).map((o) => <option key={o.id} value={o.id}>{o[f.relation!.labelField]}</option>)}
          </Select>
        );
        break;
      case 'image':
        control = <FileUpload value={v || ''} onChange={(url) => setValue(f.name, url)} folder={res.key} />;
        break;
      default:
        control = <TextInput id={id} value={v} maxLength={f.maxLength} onChange={(e) => setValue(f.name, e.target.value)} placeholder={f.placeholder} />;
    }
    return (
      <div key={f.name} className={cx(f.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
        <Label htmlFor={id} hint={f.help} required={f.required}>{f.label}</Label>
        {control}
      </div>
    );
  };

  const emptyAll = !loading && !error && rows.length === 0;
  const Icon = res.icon;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title={res.title}
        subtitle={res.description}
        actions={!res.groupBy ? <Button variant="primary" onClick={() => openNew()}><Plus className="h-4 w-4" /> Add {res.singular}</Button> : undefined}
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : (
        <div className="space-y-6">
          {emptyAll && !res.groupBy && (
            <Card><EmptyState title={`No ${res.title.toLowerCase()} yet`} hint="Nothing is stored in the database yet, so the public site shows its built-in default content." action={<Button variant="primary" onClick={() => openNew()}><Plus className="h-4 w-4" /> Add {res.singular}</Button>} /></Card>
          )}
          {sections.map((sec) => (
            <div key={sec.key}>
              {res.groupBy && (
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-cinzel text-base font-semibold tracking-wide text-[#F3DFA2]">{sec.label}</h2>
                  {sec.key !== 'orphans' && (
                    <Button size="sm" variant="subtle" onClick={() => openNew(sec.key)}><Plus className="h-3.5 w-3.5" /> Add {res.singular}</Button>
                  )}
                </div>
              )}
              {sec.items.length === 0 ? (
                res.groupBy ? <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-[#6F685B]">No {res.title.toLowerCase()} in this group yet.</div> : null
              ) : (
                <Card className="divide-y divide-white/5 overflow-hidden">
                  {sec.items.map((row, i) => (
                    <div key={row.id} className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-[#D4AF6A]/[0.04] sm:gap-4 sm:px-4">
                      <div className="flex flex-col">
                        <button aria-label="Move up" disabled={i === 0} onClick={() => move(sec.items, i, -1)} className="cursor-pointer rounded p-0.5 text-[#6F685B] hover:text-[#F3DFA2] disabled:cursor-default disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button>
                        <button aria-label="Move down" disabled={i === sec.items.length - 1} onClick={() => move(sec.items, i, 1)} className="cursor-pointer rounded p-0.5 text-[#6F685B] hover:text-[#F3DFA2] disabled:cursor-default disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button>
                      </div>
                      {res.key === 'secretariat' ? (
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#D4AF6A]/40 bg-[#121212]">
                          {row.image_url ? <img src={row.image_url} alt="" className="h-full w-full object-cover" style={{ objectPosition: row.object_position || 'center' }} /> : <Icon className="m-3 h-5 w-5 text-[#6F685B]" />}
                        </div>
                      ) : null}
                      <button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => openEdit(row)}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-[#F4EFE6]">{row[res.titleField] || 'Untitled'}</span>
                          {!row.is_published && <Badge tone="gray">Hidden</Badge>}
                          {(res.metaFields || []).map((m) => row[m] ? <Badge key={m} tone="gold">{String(row[m])}</Badge> : null)}
                        </div>
                        {res.subtitleField && row[res.subtitleField] && <div className="mt-0.5 truncate text-xs text-[#8E8678]">{row[res.subtitleField]}</div>}
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => togglePublished(row)} aria-label={row.is_published ? 'Hide from site' : 'Show on site'} title={row.is_published ? 'Visible - click to hide' : 'Hidden - click to show'}>
                          {row.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-[#6F685B]" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setToDelete(row)} aria-label="Delete" className="hover:!text-red-300"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          ))}
          {res.groupBy && groups.length === 0 && (
            <Card><EmptyState title="Add a schedule day first" hint="Events live inside days. Open “Schedule days” and create one." /></Card>
          )}
        </div>
      )}

      <Drawer
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        title={editing?.id ? `Edit ${res.singular}` : `New ${res.singular}`}
        subtitle={res.title}
        footer={
          <div className="space-y-3">
            {formError && <ErrorBox message={formError} />}
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-[#A89D8A]">
                <Toggle checked={!!editing?.values.is_published} onChange={(x) => setValue('is_published', x)} label="Published" />
                Published
              </label>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                <Button variant="primary" loading={saving} onClick={save}>Save</Button>
              </div>
            </div>
          </div>
        }
      >
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {res.fields.map(renderField)}
          </form>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete this ${res.singular}?`}
        message={
          <>
            <strong className="text-[#F4EFE6]">{toDelete?.[res.titleField]}</strong> will be removed permanently.
            {res.key === 'schedule_days' && ' All events inside this day are deleted too.'} This cannot be undone (the action is recorded in the activity log).
            Tip: use the eye icon to hide it from the site instead.
          </>
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};
