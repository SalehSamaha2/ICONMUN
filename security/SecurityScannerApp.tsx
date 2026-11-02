import React, { useEffect, useState } from 'react';
import { Camera, Loader2, LogOut, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { CheckInManager } from '../admin/CheckInManager';
import { Button, Card, Label, TextInput, ToastProvider } from '../admin/ui';

function SecurityScannerInner() {
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const verifyAccess = async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const { data: sessionData } = await sb.auth.getSession();
      if (!sessionData.session) { setAllowed(false); setSessionEmail(''); return; }
      setSessionEmail(sessionData.session.user.email || '');
      const { data, error: rpcError } = await sb.rpc('can_scan_event_pass');
      if (rpcError) throw rpcError;
      setAllowed(Boolean(data));
      if (!data) setError('This verified email is not assigned to the ICON MUN Security team or an administrator.');
    } catch (e) {
      setAllowed(false);
      setError(e instanceof Error ? e.message : 'Could not verify scanner access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) { setError('ICON MUN authentication is not configured.'); setLoading(false); return; }
    let alive = true;
    let unsubscribe = () => {};
    (async () => {
      const sb = await getSupabase()!;
      const { data } = await sb.auth.getSession();
      if (alive && data.session) await verifyAccess();
      else if (alive) setLoading(false);
      const { data: listener } = sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          window.setTimeout(() => { if (alive) void verifyAccess(); }, 0);
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    })();
    return () => { alive = false; unsubscribe(); };
  }, []);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setError(''); setNotice('');
    try {
      const sb = await getSupabase()!;
      const { error: otpError } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin + '/security-scanner', shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setNotice('A secure sign-in link has been sent to your email.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the sign-in link.');
    } finally { setSending(false); }
  };

  const signOut = async () => {
    const sb = await getSupabase()!;
    await sb.auth.signOut();
    setAllowed(false); setSessionEmail(''); setNotice('');
  };

  return (
    <main className="min-h-screen bg-[#100609] px-4 py-8 text-[#F0E8E2]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF6A]/20 pb-5">
          <a href="/" className="font-cinzel text-sm tracking-[.22em] text-[#FFF3D6]">ICON MUN <span className="text-[#D4AF6A]">/ SECURITY</span></a>
          {sessionEmail && <button onClick={() => void signOut()} className="inline-flex items-center gap-2 text-xs text-[#A89D8A] hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button>}
        </header>
        {loading ? <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#A89D8A]"><Loader2 className="h-5 w-5 animate-spin text-[#D4AF6A]" /> Verifying scanner access…</div> : allowed ? (
          <CheckInManager />
        ) : (
          <div className="mx-auto max-w-md">
            <Card className="p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF6A]/25 bg-[#D4AF6A]/10 text-[#E8CBA4]"><ShieldCheck className="h-6 w-6" /></div>
              <h1 className="mt-5 font-cinzel text-2xl text-[#FFF3D6]">Security scanner access</h1>
              <p className="mt-2 text-sm leading-6 text-[#A89D8A]">Sign in with the verified email address attached to your accepted ICON MUN Security application. Administrators can also sign in here.</p>
              {sessionEmail ? <div className="mt-5 rounded-lg border border-white/10 p-3 text-sm text-[#D7C9B4]">Signed in as {sessionEmail}</div> : (
                <form onSubmit={sendLink} className="mt-5 space-y-4">
                  <div><Label htmlFor="scanner-email">Security team email</Label><TextInput id="scanner-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email used on your application" /></div>
                  <Button type="submit" loading={sending} className="w-full"><Mail className="h-4 w-4" /> Send secure sign-in link</Button>
                </form>
              )}
              {notice && <p className="mt-4 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm text-emerald-100">{notice}</p>}
              {error && <p role="alert" className="mt-4 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
              {sessionEmail && <Button variant="subtle" className="mt-5 w-full" onClick={() => void verifyAccess()}>Check access again</Button>}
              <p className="mt-5 text-xs leading-5 text-[#776D60]">Access is checked by the database on every scan. Changing the page URL does not grant scanner permissions.</p>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SecurityScannerApp() {
  return <ToastProvider>{isSupabaseConfigured ? <SecurityScannerInner /> : <div className="min-h-screen bg-[#100609] p-8 text-white">Supabase is not configured.</div>}</ToastProvider>;
}
