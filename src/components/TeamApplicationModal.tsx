import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import { getSupabase } from '../lib/supabase';
import { getTrackStatus, TEAM_META, useNow } from '../lib/tracks';
import type { TrackKey } from '../data/defaults';

type TeamKey = Exclude<TrackKey, 'delegate'>;
const inputCls = 'w-full rounded-xl border border-[#E8CBA4]/15 bg-[#100609] px-4 py-3 min-h-[46px] text-sm text-[#FFF5E8] placeholder-[#8D737A] transition-[border,box-shadow] duration-200 focus:border-[#E8CBA4]/65 focus:outline-none focus:ring-4 focus:ring-[#E8CBA4]/[0.08]';
const labelCls = 'text-[10px] uppercase tracking-[0.16em] text-[#D8C5C5] block mb-2 font-semibold';
const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const COUNTRY_CODES = [
  ['Saudi Arabia', '+966'], ['United States', '+1'], ['Canada', '+1'], ['United Kingdom', '+44'],
  ['United Arab Emirates', '+971'], ['Egypt', '+20'], ['Sudan', '+249'], ['Kuwait', '+965'],
  ['Qatar', '+974'], ['Bahrain', '+973'], ['Oman', '+968'], ['Jordan', '+962'], ['Lebanon', '+961'],
  ['Iraq', '+964'], ['Yemen', '+967'], ['Pakistan', '+92'], ['India', '+91'], ['Bangladesh', '+880'],
  ['Philippines', '+63'], ['Indonesia', '+62'], ['Malaysia', '+60'], ['Turkey', '+90'], ['Germany', '+49'],
  ['France', '+33'], ['Italy', '+39'], ['Spain', '+34'], ['Netherlands', '+31'], ['Switzerland', '+41'],
  ['Australia', '+61'], ['New Zealand', '+64'], ['South Africa', '+27'], ['Nigeria', '+234'], ['Kenya', '+254'],
  ['Ethiopia', '+251'], ['Morocco', '+212'], ['Algeria', '+213'], ['Tunisia', '+216'], ['Libya', '+218'],
  ['Ghana', '+233'], ['Japan', '+81'], ['South Korea', '+82'], ['China', '+86'], ['Singapore', '+65'],
  ['Brazil', '+55'], ['Mexico', '+52'], ['Russia', '+7'], ['Ireland', '+353'], ['Sweden', '+46'],
  ['Norway', '+47'], ['Denmark', '+45'], ['Afghanistan', '+93'], ['Sri Lanka', '+94'], ['Nepal', '+977'],
  ['Palestine', '+970'], ['Syria', '+963'],
] as const;

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
  const [countryCode, setCountryCode] = useState('+966');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !isOpen) return;
    setError('');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 5) {
      setError('Please enter a valid phone number, including your country code.');
      return;
    }
    const missing = meta.questions.find((q) => {
      const answer = (answers[q.id] || '').trim();
      return !answer || (q.minWords !== undefined && countWords(answer) < q.minWords);
    });
    if (missing) {
      setError(missing.minWords !== undefined
        ? `“${missing.prompt}” requires at least ${missing.minWords} words.`
        : `Please answer: ${missing.prompt}`);
      return;
    }
    if (honeypot) return setDone(true);
    const clientP = getSupabase();
    if (!clientP) return setError('Applications are not available yet. Please try again later.');
    setSending(true);
    try {
      const sb = await clientP;
      const normalizedPhone = `${countryCode} ${phone.trim().replace(/^0+/, '')}`;
      const questionAnswers = Object.fromEntries(meta.questions.map((q) => [q.prompt, (answers[q.id] || '').trim()]));
      const statement = meta.questions.map((q) => `${q.prompt}\n${(answers[q.id] || '').trim()}`).join('\n\n');
      const { error: err } = await sb.from('applications').insert({
        track: trackKey, full_name: fullName.trim(), email: email.trim(), institution: institution.trim(), statement,
        details: { phone: normalizedPhone, phone_country_code: countryCode, phone_local_number: phone.trim(), question_answers: questionAnswers },
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
    <div role="dialog" aria-modal="true" aria-label={`${meta.title} application`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden overscroll-none bg-[#090407]/90 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:p-6">
      <div onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}
        className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-[1.5rem] border border-[#E8CBA4]/25 bg-[#16080E] p-5 shadow-[0_30px_100px_rgba(0,0,0,.65)] touch-pan-y sm:p-9"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gold/50 bg-surface2 text-accent transition-all hover:border-gold hover:text-inkstrong active:scale-90 sm:right-6 sm:top-6">
          <X className="pointer-events-none h-5 w-5" />
        </button>
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-gold/10"><CheckCircle2 className="h-8 w-8 text-gold" /></div>
            <h3 className="mb-2 font-cinzel text-2xl font-bold text-gold-shimmer sm:text-3xl">Application received</h3>
            <p className="mx-auto mb-8 max-w-md text-sm font-light text-ink2">Thank you for applying to join the {meta.title.toLowerCase()} team. The organisers will contact you at {email.trim() || 'your email'}.</p>
            <button type="button" onClick={onClose} className="gold-btn-primary cursor-pointer rounded px-8 py-3 text-xs font-semibold uppercase tracking-wider">Done</button>
          </div>
        ) : (
          <>
            <div className="mb-6 pr-10">
              <h3 className="font-cinzel text-2xl font-semibold tracking-tight text-[#FFF5E8] sm:text-3xl">{meta.title} application</h3>
              <p className="mt-1 text-xs text-ink3">ICON MUN 2027 organising team</p>
              <p className="mt-3 text-sm text-ink2">Answer every question below. Minimum word counts are enforced where specified.</p>
            </div>
            {!isOpen && status && <p role="alert" className="mb-5 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-accent">{status.state === 'upcoming' ? `${status.detail}.` : 'Applications for this role are not open right now.'}</p>}
            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label htmlFor="t-name" className={labelCls}>Full name *</label><input id="t-name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} autoComplete="name" /></div>
                <div><label htmlFor="t-email" className={labelCls}>Email *</label><input id="t-email" type="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label htmlFor="t-school" className={labelCls}>School / university *</label><input id="t-school" required maxLength={160} value={institution} onChange={(e) => setInstitution(e.target.value)} className={inputCls} /></div>
                <div>
                  <label htmlFor="t-phone" className={labelCls}>Phone number *</label>
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2">
                    <select id="t-phone-country" aria-label="Phone country code" required value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={inputCls + ' px-2'} autoComplete="tel-country-code">
                      {COUNTRY_CODES.map(([country, code], index) => <option key={`${country}-${code}-${index}`} value={code}>{code} — {country}</option>)}
                    </select>
                    <input id="t-phone" type="tel" required minLength={5} maxLength={20} value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d\s().-]/g, ''))} className={inputCls}
                      autoComplete="tel-national" placeholder="5X XXX XXXX" />
                  </div>
                  <p className="mt-1 text-[11px] text-[#8D737A]">Saudi Arabia (+966) is selected by default.</p>
                </div>
              </div>
              {meta.questions.map((question, index) => {
                const answer = answers[question.id] || '';
                const wordCount = countWords(answer);
                const meetsMinimum = question.minWords === undefined || wordCount >= question.minWords;
                return <div key={question.id} className="rounded-2xl border border-[#E8CBA4]/10 bg-white/[0.018] p-4 sm:p-5">
                  <label htmlFor={`team-question-${question.id}`} className={labelCls}>{index + 1}. {question.prompt}{question.minWordsLabel ? ` (${question.minWordsLabel})` : ''} *</label>
                  <textarea id={`team-question-${question.id}`} required rows={4} maxLength={4000} value={answer}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                    placeholder={question.placeholder || 'Write your answer here...'} className={`${inputCls} min-h-[120px] leading-6 resize-y`}
                    aria-describedby={question.minWords !== undefined ? `word-count-${question.id}` : undefined} />
                  {question.minWords !== undefined && <p id={`word-count-${question.id}`} className={`mt-1 text-xs ${meetsMinimum ? 'text-ink3' : 'text-gold'}`}>{wordCount} / {question.minWords} words minimum</p>}
                </div>;
              })}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label></div>
              <p className="text-[11px] leading-relaxed text-[#8D737A]">Your details are stored securely and are visible only to the ICON MUN organisers, who use them to contact you.</p>
              {error && <p role="alert" className="rounded-lg border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200">{error}</p>}
              <div className="flex flex-col-reverse items-stretch justify-end gap-3 pt-2 sm:flex-row sm:items-center">
                <button type="button" onClick={onClose} className="flex min-h-[44px] cursor-pointer items-center justify-center px-5 py-3 text-xs uppercase tracking-wider text-ink3 hover:text-inkstrong active:scale-95">Cancel</button>
                <button type="submit" disabled={sending || !isOpen} className="gold-btn-primary flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg px-8 py-3.5 text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">{sending ? 'Sending…' : 'Submit application'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
