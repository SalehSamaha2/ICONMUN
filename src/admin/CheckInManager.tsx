import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, CircleAlert, Clock3, RefreshCw, ScanLine, ShieldCheck, UserRound } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { getSupabase } from '../lib/supabase';
import { Button, Card, ErrorBox, PageHeader, TextInput, friendlyError, useToast } from './ui';

type ScanResult = {
  ok?: boolean;
  name?: string;
  email?: string;
  track?: string;
  role?: string;
  inside?: boolean;
  checked_in_at?: string | null;
  last_scanned_at?: string | null;
  message?: string;
};
type CheckedInRow = {
  application_id: string;
  full_name: string;
  email: string;
  track: string;
  role: string;
  checked_in_at: string | null;
  last_scanned_at: string | null;
};
type ScanLog = {
  full_name: string | null;
  email: string | null;
  track: string | null;
  direction: 'entry' | 'exit';
  outcome: 'allowed' | 'denied';
  reason: string | null;
  scanner_email: string | null;
  created_at: string;
};

export const CheckInManager: React.FC = () => {
  const toast = useToast();
  const scanner = useRef<Html5Qrcode | null>(null);
  const scanBusy = useRef(false);
  const directionRef = useRef<'entry' | 'exit'>('entry');
  const [token, setToken] = useState('');
  const [direction, setDirection] = useState<'entry' | 'exit'>('entry');
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [checkedIn, setCheckedIn] = useState<CheckedInRow[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => { directionRef.current = direction; }, [direction]);

  const loadLists = useCallback(async () => {
    setListLoading(true);
    try {
      const sb = await getSupabase()!;
      const [peopleResult, logsResult] = await Promise.all([
        sb.rpc('list_event_checkins'),
        sb.rpc('list_event_scan_logs'),
      ]);
      if (peopleResult.error) throw peopleResult.error;
      if (logsResult.error) throw logsResult.error;
      setCheckedIn((peopleResult.data || []) as CheckedInRow[]);
      setLogs((logsResult.data || []) as ScanLog[]);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLists();
    return () => {
      const active = scanner.current;
      if (active?.isScanning) void active.stop().catch(() => undefined);
      scanner.current = null;
    };
  }, [loadLists]);

  const performScan = async (raw: string, fromCamera = false) => {
    const value = raw.trim();
    if (!value || scanBusy.current) return;
    scanBusy.current = true;
    if (fromCamera) {
      try { scanner.current?.pause(true); } catch {}
    }
    const scanDirection = directionRef.current;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      let passToken = value;
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed?.token === 'string') passToken = parsed.token;
        else if (typeof parsed?.qrToken === 'string') passToken = parsed.qrToken;
      } catch {}
      const sb = await getSupabase()!;
      const { data, error: rpcError } = await sb.rpc('scan_event_pass', {
        p_token: passToken.trim(),
        p_direction: scanDirection,
      });
      if (rpcError) throw rpcError;
      const row = (Array.isArray(data) ? data[0] : data) as ScanResult | null;
      setResult(row || { ok: false, message: 'No response received from the scanner service.' });
      if (row?.ok) {
        setToken('');
        toast('ok', row.message || (scanDirection === 'entry' ? 'Entry recorded.' : 'Exit recorded.'));
      }
      await loadLists();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
      if (fromCamera) {
        window.setTimeout(() => {
          try {
            if (scanner.current?.isScanning) scanner.current.resume();
          } catch {}
          scanBusy.current = false;
        }, 1300);
      } else {
        scanBusy.current = false;
      }
    }
  };

  const startCamera = async () => {
    setError('');
    try {
      const existing = scanner.current;
      if (existing?.isScanning) await existing.stop();
      const instance = new Html5Qrcode('icon-checkin-reader', { verbose: false });
      scanner.current = instance;
      await instance.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decoded) => { void performScan(decoded, true); },
        () => undefined,
      );
      setCameraOn(true);
    } catch (e) {
      setCameraOn(false);
      const message = e instanceof Error ? e.message : '';
      setError(/permission|notallowed|denied/i.test(message)
        ? 'Camera permission was blocked. Allow camera access for this site in your browser settings, then try again. Manual pass entry is still available.'
        : message || 'Camera access failed. Check browser permissions or enter the pass code manually.');
    }
  };

  const stopCamera = async () => {
    if (scanner.current?.isScanning) await scanner.current.stop().catch(() => undefined);
    scanner.current = null;
    setCameraOn(false);
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    void performScan(token);
  };

  return (
    <div>
      <PageHeader eyebrow="Event operations" title="ICON MUN QR scanner" subtitle="Scan official passes for entry and exit. Access is limited by the database to ICON MUN admins and accepted Security team members." />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8CBA4]/25 bg-[#E8CBA4]/10 text-[#E8CBA4]"><ScanLine /></span>
            <div><h2 className="font-cinzel text-lg text-[#FFF3D6]">Scan a digital pass</h2><p className="mt-1 text-sm text-[#A89D8A]">Use a phone camera or enter the pass code manually.</p></div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant={direction === 'entry' ? 'primary' : 'subtle'} onClick={() => { setDirection('entry'); setResult(null); }}>Record entry</Button>
            <Button variant={direction === 'exit' ? 'primary' : 'subtle'} onClick={() => { setDirection('exit'); setResult(null); }}>Record exit</Button>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-2">
            <div id="icon-checkin-reader" className="min-h-8 overflow-hidden rounded-lg" />
            {!cameraOn && <p className="px-3 py-4 text-center text-xs text-[#8E8678]">Camera preview appears here when started.</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {!cameraOn ? <Button onClick={() => void startCamera()}><Camera className="h-4 w-4" /> Start camera</Button> : <Button variant="subtle" onClick={() => void stopCamera()}><CameraOff className="h-4 w-4" /> Stop camera</Button>}
          </div>
          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-[#6F685B]"><span className="h-px flex-1 bg-white/10" />Or enter pass code<span className="h-px flex-1 bg-white/10" /></div>
          <form onSubmit={submitManual} className="flex flex-col gap-3 sm:flex-row">
            <TextInput aria-label="Pass code" placeholder="Paste QR pass code…" value={token} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)} />
            <Button type="submit" loading={busy} disabled={!token.trim()}><ShieldCheck className="h-4 w-4" /> Verify {direction}</Button>
          </form>
          {error && <ErrorBox message={error} onRetry={() => { setError(''); void loadLists(); }} />}
          <p className="mt-4 text-xs leading-5 text-[#8E8678]">Camera access requires HTTPS and browser permission. A scan is verified and recorded by a protected database function; the browser cannot mark a pass as checked in by itself.</p>
        </Card>

        <Card className="p-5 sm:p-7">
          <h2 className="font-cinzel text-lg text-[#FFF3D6]">Latest scan</h2>
          {!result ? <div className="flex min-h-64 flex-col items-center justify-center text-center text-[#8E8678]"><ShieldCheck className="h-10 w-10 text-[#6F685B]" /><p className="mt-3 text-sm">Attendee details appear here after a scan.</p></div> : (
            <div className="mt-5">
              <div className={'flex items-center gap-3 rounded-xl border p-4 ' + (result.ok ? 'border-emerald-300/25 bg-emerald-300/5' : 'border-rose-300/25 bg-rose-300/5')}>
                {result.ok ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-200" /> : <CircleAlert className="h-6 w-6 shrink-0 text-rose-200" />}
                <div><p className={'font-medium ' + (result.ok ? 'text-emerald-100' : 'text-rose-100')}>{result.message || (result.ok ? 'Scan recorded' : 'Pass rejected')}</p><p className="mt-1 text-xs text-[#A89D8A]">{result.last_scanned_at ? new Date(result.last_scanned_at).toLocaleString() : 'No scan recorded'}</p></div>
              </div>
              {result.name && <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-[#E8CBA4]" /><div><p className="font-medium text-[#FFF3D6]">{result.name}</p><p className="text-xs text-[#A89D8A]">{result.email || ''}</p></div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 p-3"><p className="text-[10px] uppercase tracking-[.16em] text-[#8E8678]">Track</p><p className="mt-1 text-sm text-[#E6D6C4]">{result.track || '—'}</p></div>
                  <div className="rounded-xl border border-white/10 p-3"><p className="text-[10px] uppercase tracking-[.16em] text-[#8E8678]">Assignment</p><p className="mt-1 text-sm text-[#E6D6C4]">{result.role || '—'}</p></div>
                </div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-[10px] uppercase tracking-[.16em] text-[#8E8678]">Current status</p><p className="mt-1 text-sm text-[#E6D6C4]">{result.inside ? 'Inside the venue' : 'Outside the venue'}</p></div>
              </div>}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-cinzel text-lg text-[#FFF3D6]">Currently checked in</h2><p className="mt-1 text-xs text-[#8E8678]">{checkedIn.length} people currently inside</p></div><Button size="sm" variant="subtle" onClick={() => void loadLists()}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button></div>
          {listLoading ? <p className="py-8 text-center text-sm text-[#8E8678]">Loading check-ins…</p> : checkedIn.length === 0 ? <p className="py-8 text-center text-sm text-[#8E8678]">No one is currently checked in.</p> : (
            <div className="mt-4 space-y-2">{checkedIn.map(person => <div key={person.application_id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm text-[#FFF3D6]">{person.full_name}</p><p className="mt-1 truncate text-xs text-[#8E8678]">{person.track} · {person.role || '—'}</p></div><span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] text-emerald-200">Inside</span></div>)}</div>
          )}
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-cinzel text-lg text-[#FFF3D6]">Recent scan history</h2><p className="mt-1 text-xs text-[#8E8678]">Latest 100 recorded attempts</p></div><Clock3 className="h-5 w-5 text-[#D4AF6A]" /></div>
          {listLoading ? <p className="py-8 text-center text-sm text-[#8E8678]">Loading history…</p> : logs.length === 0 ? <p className="py-8 text-center text-sm text-[#8E8678]">No scans recorded yet.</p> : (
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">{logs.map((log, index) => <div key={log.created_at + index} className="rounded-lg border border-white/10 px-3 py-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm text-[#FFF3D6]">{log.full_name || 'Unrecognised pass'}</p><span className={'rounded-full px-2 py-1 text-[10px] uppercase ' + (log.outcome === 'allowed' ? 'bg-emerald-300/10 text-emerald-200' : 'bg-rose-300/10 text-rose-200')}>{log.outcome}</span></div><p className="mt-1 text-xs text-[#8E8678]">{log.direction} · {log.scanner_email || 'Security scanner'} · {new Date(log.created_at).toLocaleString()}</p>{log.reason && <p className="mt-1 text-xs text-[#A89D8A]">{log.reason}</p>}</div>)}</div>
          )}
        </Card>
      </div>
    </div>
  );
};
