import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, LogOut, Mail, RefreshCw, ShieldCheck, Ticket } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../src/lib/supabase';

type PassRow = {
  application_id: string;
  created_at: string;
  full_name: string;
  email: string;
  track: string;
  status: string;
  committee: string;
  role: string;
  pass_token: string | null;
  inside: boolean;
  checked_in_at: string | null;
  last_scanned_at: string | null;
};

export default function PassPortal() {
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const [rows, setRows] = useState<PassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const loadPasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const { data: sessionData } = await sb.auth.getSession();
      if (!sessionData.session) {
        setSessionEmail('');
        setRows([]);
        return;
      }
      setSessionEmail(sessionData.session.user.email || '');
      const { data, error: rpcError } = await sb.rpc('my_event_passes');
      if (rpcError) throw rpcError;
      setRows((data || []) as PassRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your ICON MUN pass.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('The ICON MUN sign-in service is not configured.');
      setLoading(false);
      return;
    }
    let alive = true;
    let unsubscribe = () => {};
    (async () => {
      const sb = await getSupabase()!;
      const { data } = await sb.auth.getSession();
      if (alive && data.session) await loadPasses();
      const { data: listener } = sb.auth.onAuthStateChange((event: string) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          window.setTimeout(() => { if (alive) void loadPasses(); }, 0);
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();
      if (alive && !data.session) setLoading(false);
    })();
    return () => { alive = false; unsubscribe(); };
  }, [loadPasses]);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      const sb = await getSupabase()!;
      const { error: otpError } = await sb.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin + '/pass',
          shouldCreateUser: true,
        },
      });
      if (otpError) throw otpError;
      setNotice('A secure sign-in link has been sent. Open it from the same email address to view your pass.');
      setCooldown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the sign-in link.');
    } finally {
      setSending(false);
    }
  };

  const signOut = async () => {
    const sb = await getSupabase()!;
    await sb.auth.signOut();
    setRows([]);
    setSessionEmail('');
    setNotice('');
  };

  const trackLabel = (track: string) => track === 'delegate' ? 'Delegate' : track.charAt(0).toUpperCase() + track.slice(1);

  if (!isSupabaseConfigured) return <Shell><Notice tone="error">ICON MUN authentication is not configured.</Notice></Shell>;

  return (
    <Shell>
      <header className="mb-7 flex items-center justify-between border-b border-[#D4AF6A]/20 pb-5">
        <a href="/" className="inline-flex items-center gap-2 text-xs text-[#A89D8A] hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to ICON MUN</a>
        {sessionEmail ? <button onClick={() => void signOut()} className="inline-flex items-center gap-2 text-xs text-[#A89D8A] hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button> : <span className="font-mono text-[10px] uppercase tracking-[.2em] text-[#D4AF6A]">Secure access</span>}
      </header>
      <section className="overflow-hidden rounded-2xl border border-[#D4AF6A]/25 bg-[#16080E]/90 shadow-2xl">
        <div className="border-b border-[#D4AF6A]/15 px-6 py-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF6A]/30 bg-[#D4AF6A]/10 text-[#E8CBA4]"><ShieldCheck className="h-7 w-7" /></div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#D4AF6A]">ICON MUN · OFFICIAL ENTRY</p>
          <h1 className="mt-2 font-cinzel text-3xl text-[#FFF3D6]">Your digital pass</h1>
          <p className="mt-2 text-sm text-[#A89D8A]">Securely access the pass linked to your accepted application.</p>
        </div>

        {loading ? <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-[#A89D8A]"><Loader2 className="h-5 w-5 animate-spin text-[#D4AF6A]" /> Checking your application…</div> : sessionEmail ? (
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[.2em] text-[#8E8678]">Verified email</p>
              <p className="mt-1 text-sm text-[#FFF3D6]">{sessionEmail}</p>
            </div>
            {rows.length === 0 ? <Notice tone="info">No ICON MUN application is linked to this verified email address yet.</Notice> : rows.map((row) => (
              <article key={row.application_id} className="rounded-xl border border-[#D4AF6A]/20 bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-[10px] uppercase tracking-[.18em] text-[#D4AF6A]">{trackLabel(row.track)} application</p><h2 className="mt-1 font-cinzel text-xl text-[#FFF3D6]">{row.full_name}</h2><p className="mt-1 text-xs text-[#A89D8A]">{row.role || row.committee || 'ICON MUN'}</p></div>
                  <span className={'rounded-full border px-3 py-1 text-[10px] uppercase tracking-[.12em] ' + (row.status === 'accepted' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-white/15 bg-white/5 text-[#C4BAA8]')}>{row.status}</span>
                </div>
                {row.status === 'accepted' && row.pass_token ? (
                  <div className="mt-5 flex flex-col items-center rounded-xl border border-white/10 bg-white p-5">
                    <QRCodeSVG value={row.pass_token} size={240} level="H" includeMargin />
                    <div className="mt-4 text-center"><p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-[#7C6336]"><Ticket className="h-3.5 w-3.5" /> Registered pass holder</p><p className="mt-1 text-lg font-semibold text-[#21180E]">{row.full_name}</p><p className="mt-1 text-xs text-[#6F6252]">{trackLabel(row.track)} · {row.role || row.committee}</p></div>
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-xs text-[#514535]">{row.inside ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <Clock3 className="h-4 w-4" />}{row.inside ? 'Currently checked in' : 'Not currently checked in'}</div>
                  </div>
                ) : <Notice tone="info">{row.status === 'accepted' ? 'Your pass is being prepared. Refresh in a moment.' : 'A QR pass will appear here once your application is accepted.'}</Notice>}
              </article>
            ))}
            <button onClick={() => void loadPasses()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF6A]/25 px-4 py-3 text-sm text-[#E8CBA4] hover:bg-[#D4AF6A]/10"><RefreshCw className="h-4 w-4" /> Refresh pass status</button>
            <p className="text-center text-[11px] leading-relaxed text-[#776D60]">Your QR code is unique to your verified email and accepted application. Do not share screenshots or copies.</p>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-4 p-6">
            <div><label htmlFor="icon-pass-email" className="mb-2 block text-sm text-[#E6D6C4]">Application email address</label><input id="icon-pass-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="The email used on your application" className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF6A]" /></div>
            {notice && <Notice tone="success">{notice}</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
            <button type="submit" disabled={sending || !email.trim() || cooldown > 0} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF6A] px-4 py-3 text-sm font-semibold text-[#1A1008] disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Send secure sign-in link'}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-[#776D60]">Only a verified email matching an ICON MUN application can view its status or pass.</p>
          </form>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#100609] px-4 py-10 text-[#F0E8E2]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}><div className="mx-auto max-w-xl">{children}</div></main>;
}

function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'success' | 'error' }) {
  const styles = tone === 'error' ? 'border-rose-400/30 bg-rose-400/10 text-rose-100' : tone === 'success' ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' : 'border-[#D4AF6A]/20 bg-[#D4AF6A]/5 text-[#D7C9B4]';
  return <p className={'rounded-lg border px-4 py-3 text-sm ' + styles}>{children}</p>;
}
