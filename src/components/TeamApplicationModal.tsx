import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import { getSupabase } from '../lib/supabase';
import { getTrackStatus, TEAM_META, useNow } from '../lib/tracks';
import type { TrackKey } from '../data/defaults';

type TeamKey = Exclude<TrackKey, 'delegate'>;

const inputCls =
  'w-full rounded-lg border border-ink/10 bg-surface2 px-4 py-3 min-h-[44px] text-base text-inkstrong focus:border-gold focus:outline-none';
const labelCls = 'text-xs uppercase tracking-wider text-ink2 block mb-1.5 font-medium';

export const TeamApplicationModal: React.FC<{ trackKey: TeamKey; onClose: () => void }> = ({ trackKey, onClose }) => {
  const meta = TEAM_META[trackKey];
  const { tracks } = useSiteData();
  const track = tracks.find((t) => t.key === trackKey);
  const now = useNow();
  const status = track ? getTrackStatus(track, now) : null;
  const isOpen = status?.state === 'open';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [focus, setFocus] = useState(meta.focusOptions[0]);
  const [availability, setAvailability] = useState('');
  const [statement, setStatement] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !isOpen) return;
    setError('');
    if (honeypot) return setDone(true); // bots fill hidden fields

    const clientP = getSupabase();
    if (!clientP) return setError('Applications are not available yet. Please try again later.');

    setSending(true);
    try {
      const sb = await clientP;
      const { error: err } = await sb.from('applications').insert({
        track: trackKey,
        full_name: fullName.trim(),
        email: email.trim(),
        institution: institution.trim(),
        statement: statement.trim(),
        details: {
          phone: phone.trim(),
          focus,
          availability: availability.trim(),
        },
      });
      if (err) {
        const msg = err.message || '';
        if (/closed/i.test(msg)) setError('Applications for this role are currently closed.');
        else if (/already been used/i.test(msg)) setError('This email has already been used for several applications.');
        else if (/Too many/i.test(msg)) setError('We are receiving many applications right now. Please try again in a few minutes.');
        else setError('Something went wrong. Please check your details and try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.title} application`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 animate-in fade-in duration-200 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/50 bg-[#0C0C0C] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.9)] sm:p-10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gold/50 bg-surface2 text-accent transition-all hover:border-gold hover:text-inkstrong active:scale-90 sm:right-6 sm:top-6"
        >
          <X className="pointer-events-none h-5 w-5" />
        </button>

        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-gold/10">
              <CheckCircle2 className="h-8 w-8 text-gold" />
            </div>
            <h3 className="mb-2 font-cinzel text-2xl font-bold text-gold-shimmer sm:text-3xl">Application received</h3>
            <p className="mx-auto mb-8 max-w-md text-sm font-light text-ink2">
              Thank you for applying to join the {meta.title.toLowerCase()} team. The organisers will contact you at {email.trim() || 'your email'}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="gold-btn-primary cursor-pointer rounded px-8 py-3 text-xs font-semibold uppercase tracking-wider"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 pr-10">
              <h3 className="font-cinzel text-2xl font-bold text-gold-gradient sm:text-3xl">{meta.title} application</h3>
              <p className="mt-1 text-xs text-ink3">ICON MUN 2027 organising team</p>
            </div>

            {!isOpen && status && (
              <p role="alert" className="mb-5 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-accent">
                {status.state === 'upcoming' ? `${status.detail}.` : 'Applications for this role are not open right now.'}
              </p>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="t-name" className={labelCls}>Full name *</label>
                  <input id="t-name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="t-email" className={labelCls}>Email *</label>
                  <input id="t-email" type="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="t-school" className={labelCls}>School / university *</label>
                  <input id="t-school" required maxLength={160} value={institution} onChange={(e) => setInstitution(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="t-phone" className={labelCls}>Phone (optional)</label>
                  <input id="t-phone" type="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} autoComplete="tel" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="t-focus" className={labelCls}>{meta.focusLabel}</label>
                  <select id="t-focus" value={focus} onChange={(e) => setFocus(e.target.value)} className={inputCls}>
                    {meta.focusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="t-avail" className={labelCls}>Availability (optional)</label>
                  <input id="t-avail" maxLength={200} value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Days and times you can commit" className={inputCls} />
                </div>
              </div>

              <div>
                <label htmlFor="t-why" className={labelCls}>{meta.statementLabel} *</label>
                <textarea id="t-why" required rows={4} maxLength={1500} value={statement} onChange={(e) => setStatement(e.target.value)} placeholder={meta.statementPlaceholder} className={`${inputCls} min-h-[110px]`} />
              </div>

              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
              </div>

              <p className="text-[11px] leading-relaxed text-ink4">
                Your details are stored securely and are visible only to the ICON MUN organisers, who use them to contact you.
              </p>

              {error && (
                <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
              )}

              <div className="flex flex-col-reverse items-stretch justify-end gap-3 pt-2 sm:flex-row sm:items-center">
                <button type="button" onClick={onClose} className="flex min-h-[44px] cursor-pointer items-center justify-center px-5 py-3 text-xs uppercase tracking-wider text-ink3 hover:text-inkstrong active:scale-95">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !isOpen}
                  className="gold-btn-primary flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg px-8 py-3.5 text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Submit application'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
