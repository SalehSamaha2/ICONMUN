import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  X,
  Shield,
  Camera,
  HeartHandshake,
  Calendar,
  Sparkles,
  AlertCircle,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import { getSupabase } from '../lib/supabase';
import { getTrackStatus, TEAM_META, useNow, type TeamQuestion } from '../lib/tracks';
import type { TrackKey } from '../data/defaults';
import { PhoneInput } from './PhoneInput';

type TeamKey = Exclude<TrackKey, 'delegate'>;

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const TRACK_CONFIG: Record<TeamKey, {
  icon: React.ComponentType<{ className?: string }>;
  department: string;
  tagline: string;
  badgeTone: string;
}> = {
  media: {
    icon: Camera,
    department: 'Directorate of Media & Public Relations',
    tagline: 'Document the diplomacy, elevate the narrative, and capture conference history.',
    badgeTone: 'border-[#E8CBA4]/40 text-[#E8CBA4] bg-[#E8CBA4]/10',
  },
  security: {
    icon: Shield,
    department: 'Directorate of Protocol & Safety',
    tagline: 'Maintain order, safeguard delegates, and uphold conference integrity.',
    badgeTone: 'border-amber-400/40 text-amber-300 bg-amber-400/10',
  },
  volunteer: {
    icon: HeartHandshake,
    department: 'Directorate of Conference Operations',
    tagline: 'Empower committee proceedings, coordinate logistics, and serve delegates.',
    badgeTone: 'border-[#F3DFA2]/40 text-[#F3DFA2] bg-[#F3DFA2]/10',
  },
};

const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Guardian',
  'Sibling',
  'Relative',
  'Other',
];

export const TeamApplicationModal: React.FC<{ trackKey: TeamKey; onClose: () => void }> = ({
  trackKey,
  onClose,
}) => {
  const meta = TEAM_META[trackKey];
  const config = TRACK_CONFIG[trackKey];
  const TrackIcon = config.icon;
  const { tracks } = useSiteData();
  const track = tracks.find((t) => t.key === trackKey);
  const now = useNow();
  const status = track ? getTrackStatus(track, now) : null;
  const isOpen = status?.state === 'open';

  // Applicant info state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+966');

  // Emergency contact custom state
  const [emergencyCountryCode, setEmergencyCountryCode] = useState('+966');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Parent');
  const [emergencyCustomRel, setEmergencyCustomRel] = useState('');

  // Questionnaire answers
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Explanations for Yes/No with explanation (e.g. upload_access)
  const [uploadExplanation, setUploadExplanation] = useState('');

  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Sync emergency contact state to answers['emergency_contact']
  useEffect(() => {
    const rawNumber = emergencyPhone.trim();
    if (!rawNumber) {
      setAnswers((prev) => {
        if (!prev.emergency_contact) return prev;
        const next = { ...prev };
        delete next.emergency_contact;
        return next;
      });
      return;
    }
    const rel = emergencyRelationship === 'Other' && emergencyCustomRel.trim()
      ? emergencyCustomRel.trim()
      : emergencyRelationship;
    const formatted = `${emergencyCountryCode} ${rawNumber}${rel ? ` (${rel})` : ''}`;
    setAnswers((prev) => ({ ...prev, emergency_contact: formatted }));
  }, [emergencyCountryCode, emergencyPhone, emergencyRelationship, emergencyCustomRel]);

  // Lock body scroll and listen for Escape key
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

  // Handle generic answer change
  const setAnswerValue = (id: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
    if (error) setError('');
  };

  // Grade options based on track
  const gradeOptions = useMemo(() => {
    if (trackKey === 'media') {
      return ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'First-year university'];
    }
    return ['Grade 10', 'Grade 11', 'Grade 12', 'First-year university'];
  }, [trackKey]);

  // Form submission handler
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !isOpen) return;
    setError('');

    // Validate consent
    if (!consent) {
      setError('Please review and agree to the Privacy Policy and Terms of Participation before submitting.');
      return;
    }

    // Validate applicant phone
    if (!phone.trim() || phone.replace(/\D/g, '').length < 6) {
      setError('Please provide a valid personal phone number with dialing code.');
      return;
    }

    // Validate emergency phone
    if (!emergencyPhone.trim() || emergencyPhone.replace(/\D/g, '').length < 6) {
      setError('Please provide a valid emergency contact phone number and relationship.');
      return;
    }

    // Validate all required questions and word counts
    const missing = meta.questions.find((q) => {
      const answer = (answers[q.id] || '').trim();
      if (!answer) return true;
      if (q.minWords !== undefined && countWords(answer) < q.minWords) return true;
      return false;
    });

    if (missing) {
      const answer = (answers[missing.id] || '').trim();
      if (!answer) {
        setError(`Please answer the question: “${missing.prompt}”`);
      } else if (missing.minWords !== undefined) {
        setError(`“${missing.prompt}” requires at least ${missing.minWords} words (currently ${countWords(answer)}).`);
      }
      return;
    }

    if (honeypot) return setDone(true);
    const clientP = getSupabase();
    if (!clientP) return setError('Applications are not available yet. Please try again later.');

    setSending(true);
    try {
      const sb = await clientP;
      const normalizedPhone = `${countryCode} ${phone.trim().replace(/^0+/, '')}`;

      const completeStatement = meta.questions
        .map((q) => `${q.prompt}\n${(answers[q.id] || '').trim()}`)
        .join('\n\n');

      const statementChars = Array.from(completeStatement);
      const statement = statementChars.slice(0, 2000).join('');
      const statementOverflow = statementChars.slice(2000).join('');

      const details = {
        phone: normalizedPhone,
        ...(statementOverflow ? { statement_overflow: statementOverflow } : {}),
      };

      const detailsBytes = new TextEncoder().encode(JSON.stringify(details)).length;
      if (detailsBytes > 2800) {
        setError('Your combined answers exceed the database storage limit. Please shorten them slightly and try again.');
        return;
      }

      const { error: err } = await sb.from('applications').insert({
        track: trackKey,
        full_name: fullName.trim(),
        email: email.trim(),
        institution: institution.trim(),
        statement,
        details,
      });

      if (err) {
        const msg = err.message || '';
        if (/closed/i.test(msg)) setError('Applications for this role are currently closed.');
        else if (/already been used/i.test(msg)) setError('This email has already been used for several applications.');
        else if (/Too many/i.test(msg)) setError('We are receiving many applications right now. Please try again in a few minutes.');
        else if (err.code === '23514' && /applications_statement_check/i.test(msg)) {
          setError('Your application answers could not be saved because the statement field exceeded its database limit. Please shorten them slightly.');
        } else if (err.code === '23514' && /details/i.test(msg)) {
          setError('Your application answers are too long. Please shorten them slightly and try again.');
        } else if (err.code === '42501' || /permission|row-level security/i.test(msg)) {
          setError('The application system is not accepting submissions right now. Please contact the organisers.');
        } else {
          console.error('ICON MUN application submission failed:', { code: err.code, message: msg });
          setError('We could not save your application. Please try again, or contact the organisers if the problem continues.');
        }
        return;
      }

      setDone(true);
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  /**
   * Render specialized question inputs based on prompt and ID
   */
  const renderQuestionControl = (question: TeamQuestion, index: number) => {
    const rawAnswer = answers[question.id] || '';
    const wordCount = countWords(rawAnswer);
    const meetsMinimum = question.minWords === undefined || wordCount >= question.minWords;

    // 1. Gender Selection (Segmented male/female buttons)
    if (question.id === 'gender') {
      const options = ['Male', 'Female'];
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {options.map((opt) => {
              const isSelected = rawAnswer === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswerValue(question.id, opt)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? 'border-[#E8CBA4] bg-gradient-to-r from-[#D4AF6A]/25 via-[#E8CBA4]/20 to-[#D4AF6A]/15 text-[#FFF5E8] shadow-[0_0_20px_rgba(212,175,106,0.2)]'
                      : 'border-[#E8CBA4]/20 bg-[#160810]/70 text-[#D8C5C5] hover:border-[#E8CBA4]/45 hover:text-[#FFF5E8] hover:bg-[#1E0B15]'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full transition-colors ${isSelected ? 'bg-[#E8CBA4]' : 'bg-[#E8CBA4]/20'}`} />
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // 2. Grade Selection (Predefined Dropdown)
    if (question.id === 'grade') {
      return (
        <div className="relative max-w-md">
          <select
            id={`team-question-${question.id}`}
            required
            value={rawAnswer}
            onChange={(e) => setAnswerValue(question.id, e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#E8CBA4]/25 bg-[#12050A] px-4 py-3 min-h-[46px] text-sm text-[#FFF5E8] transition-all duration-200 focus:border-[#E8CBA4] focus:outline-none focus:ring-4 focus:ring-[#E8CBA4]/[0.1] cursor-pointer"
          >
            <option value="" disabled className="bg-[#12050A] text-[#8D737A]">
              Select your current grade level...
            </option>
            {gradeOptions.map((g) => (
              <option key={g} value={g} className="bg-[#180810] text-[#FFF5E8]">
                {g}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#E8CBA4]">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      );
    }

    // 3. Date of Birth Picker
    if (question.id === 'birth_date') {
      return (
        <div className="relative max-w-sm">
          <div className="relative flex items-center">
            <input
              id={`team-question-${question.id}`}
              type="date"
              required
              min="1990-01-01"
              max="2016-12-31"
              value={rawAnswer}
              onChange={(e) => setAnswerValue(question.id, e.target.value)}
              className="w-full rounded-xl border border-[#E8CBA4]/25 bg-[#12050A] px-4 py-3 min-h-[46px] text-sm text-[#FFF5E8] transition-all duration-200 focus:border-[#E8CBA4] focus:outline-none focus:ring-4 focus:ring-[#E8CBA4]/[0.1] [color-scheme:dark]"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[#8D737A]">Format: Month / Day / Year</p>
        </div>
      );
    }

    // 4. Emergency Contact Number & Relationship (Dedicated Phone Component + Relationship)
    if (question.id === 'emergency_contact') {
      return (
        <div className="space-y-4 rounded-xl border border-[#E8CBA4]/15 bg-[#160810]/40 p-4">
          <div>
            <PhoneInput
              id={`team-emergency-phone`}
              countryCode={emergencyCountryCode}
              phoneNumber={emergencyPhone}
              onCountryCodeChange={(code) => setEmergencyCountryCode(code)}
              onPhoneNumberChange={(num) => setEmergencyPhone(num)}
              label="Emergency phone number"
              required
              placeholder="5X XXX XXXX"
              helperText="Default set to Saudi Arabia (+966 🇸🇦). Search for international codes above."
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.16em] text-[#D8C5C5] block mb-2 font-semibold">
              Relationship to applicant *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RELATIONSHIP_OPTIONS.map((rel) => {
                const isSelected = emergencyRelationship === rel;
                return (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setEmergencyRelationship(rel)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#E8CBA4] bg-[#E8CBA4]/20 text-[#FFF5E8] shadow-sm'
                        : 'border-[#E8CBA4]/15 bg-[#12050A] text-[#D8C5C5] hover:border-[#E8CBA4]/30 hover:text-[#FFF5E8]'
                    }`}
                  >
                    {rel}
                  </button>
                );
              })}
            </div>

            {emergencyRelationship === 'Other' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  required
                  placeholder="Specify relationship (e.g. Uncle, Mentor, Teacher)"
                  value={emergencyCustomRel}
                  onChange={(e) => setEmergencyCustomRel(e.target.value)}
                  className="w-full rounded-xl border border-[#E8CBA4]/20 bg-[#12050A] px-3.5 py-2.5 text-xs text-[#FFF5E8] placeholder-[#8D737A] focus:border-[#E8CBA4] focus:outline-none focus:ring-2 focus:ring-[#E8CBA4]/15"
                />
              </div>
            )}
          </div>

          {emergencyPhone.trim() && (
            <div className="flex items-center gap-2 pt-1 text-xs text-[#E8CBA4]/90 font-mono">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Contact record: {rawAnswer}</span>
            </div>
          )}
        </div>
      );
    }

    // 5. Upload Access question in Media (Yes / No + optional device explanation)
    if (question.id === 'upload_access') {
      const isYes = rawAnswer.startsWith('Yes');
      const isNo = rawAnswer.startsWith('No');

      const handleSelect = (choice: 'Yes' | 'No') => {
        if (uploadExplanation.trim()) {
          setAnswerValue(question.id, `${choice} — ${uploadExplanation.trim()}`);
        } else {
          setAnswerValue(question.id, choice);
        }
      };

      const handleExplanationChange = (text: string) => {
        setUploadExplanation(text);
        const choice = isNo ? 'No' : 'Yes';
        setAnswerValue(question.id, text.trim() ? `${choice} — ${text.trim()}` : choice);
      };

      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => handleSelect('Yes')}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer border ${
                isYes
                  ? 'border-[#E8CBA4] bg-gradient-to-r from-[#D4AF6A]/25 via-[#E8CBA4]/20 to-[#D4AF6A]/15 text-[#FFF5E8] shadow-[0_0_20px_rgba(212,175,106,0.2)]'
                  : 'border-[#E8CBA4]/20 bg-[#160810]/70 text-[#D8C5C5] hover:border-[#E8CBA4]/45 hover:text-[#FFF5E8]'
              }`}
            >
              <Check className={`h-3.5 w-3.5 ${isYes ? 'text-[#E8CBA4]' : 'text-transparent'}`} />
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleSelect('No')}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer border ${
                isNo
                  ? 'border-amber-400/80 bg-amber-500/20 text-[#FFF5E8] shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'border-[#E8CBA4]/20 bg-[#160810]/70 text-[#D8C5C5] hover:border-[#E8CBA4]/45 hover:text-[#FFF5E8]'
              }`}
            >
              <X className={`h-3.5 w-3.5 ${isNo ? 'text-amber-300' : 'text-transparent'}`} />
              No
            </button>
          </div>

          <div className="mt-3">
            <label htmlFor="upload-exp" className="text-[10px] uppercase tracking-[0.14em] text-[#8D737A] block mb-1.5 font-medium">
              Optional details / equipment model:
            </label>
            <input
              id="upload-exp"
              type="text"
              value={uploadExplanation}
              onChange={(e) => handleExplanationChange(e.target.value)}
              placeholder="e.g. MacBook Pro with SD card slot, USB-C card reader, iPad"
              className="w-full rounded-xl border border-[#E8CBA4]/20 bg-[#12050A] px-3.5 py-2.5 text-xs text-[#FFF5E8] placeholder-[#8D737A] focus:border-[#E8CBA4] focus:outline-none focus:ring-2 focus:ring-[#E8CBA4]/15"
            />
          </div>
        </div>
      );
    }

    // 6. Generic Yes / No Questions (Attendance, Orientation, etc.)
    if (question.prompt.includes('(Yes / No)')) {
      const isYes = rawAnswer.toLowerCase().startsWith('yes');
      const isNo = rawAnswer.toLowerCase().startsWith('no');

      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => setAnswerValue(question.id, 'Yes')}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer border ${
                isYes
                  ? 'border-[#E8CBA4] bg-gradient-to-r from-[#D4AF6A]/25 via-[#E8CBA4]/20 to-[#D4AF6A]/15 text-[#FFF5E8] shadow-[0_0_20px_rgba(212,175,106,0.2)]'
                  : 'border-[#E8CBA4]/20 bg-[#160810]/70 text-[#D8C5C5] hover:border-[#E8CBA4]/45 hover:text-[#FFF5E8]'
              }`}
            >
              <Check className={`h-3.5 w-3.5 ${isYes ? 'text-[#E8CBA4]' : 'text-transparent'}`} />
              Yes
            </button>
            <button
              type="button"
              onClick={() => setAnswerValue(question.id, 'No')}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer border ${
                isNo
                  ? 'border-amber-400/80 bg-amber-500/20 text-[#FFF5E8] shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'border-[#E8CBA4]/20 bg-[#160810]/70 text-[#D8C5C5] hover:border-[#E8CBA4]/45 hover:text-[#FFF5E8]'
              }`}
            >
              <X className={`h-3.5 w-3.5 ${isNo ? 'text-amber-300' : 'text-transparent'}`} />
              No
            </button>
          </div>
          {isNo && question.prompt.includes('If no, explain in the final question') && (
            <p className="text-[11px] text-amber-200/90 flex items-center gap-1.5 pt-1">
              <Info className="h-3 w-3 shrink-0" />
              Please remember to explain any schedule limitations in the final question below.
            </p>
          )}
        </div>
      );
    }

    // 7. Questions with "Write N/A if none" or "Write N/A if you have none"
    const hasNaOption = question.prompt.includes('Write N/A if');
    const isWrittenQuestion = question.minWords !== undefined;
    const isNaActive = rawAnswer.trim().toUpperCase() === 'N/A';

    return (
      <div className="space-y-2">
        {hasNaOption && (
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] text-[#8D737A]">Have no prior experience / concerns to report?</span>
            <button
              type="button"
              onClick={() => setAnswerValue(question.id, isNaActive ? '' : 'N/A')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                isNaActive
                  ? 'border-[#E8CBA4] bg-[#E8CBA4]/20 text-[#FFF5E8] font-bold'
                  : 'border-[#E8CBA4]/25 bg-black/40 text-[#D8C5C5] hover:text-[#FFF5E8] hover:border-[#E8CBA4]/50'
              }`}
            >
              {isNaActive ? '✓ N/A Selected' : '+ Set N/A'}
            </button>
          </div>
        )}

        <textarea
          id={`team-question-${question.id}`}
          required
          rows={isWrittenQuestion ? 5 : 3}
          maxLength={4000}
          value={rawAnswer}
          onChange={(e) => setAnswerValue(question.id, e.target.value)}
          placeholder={question.placeholder || 'Type your response here...'}
          aria-describedby={question.minWords !== undefined ? `word-count-${question.id}` : undefined}
          className={`w-full rounded-xl border bg-[#12050A] px-4 py-3 text-sm text-[#FFF5E8] placeholder-[#8D737A] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#E8CBA4]/[0.1] leading-relaxed resize-y ${
            isWrittenQuestion ? 'min-h-[130px]' : 'min-h-[85px]'
          } ${
            question.minWords !== undefined && !meetsMinimum && rawAnswer.length > 0
              ? 'border-amber-400/50 focus:border-amber-400'
              : 'border-[#E8CBA4]/25 focus:border-[#E8CBA4]'
          }`}
        />

        {question.minWords !== undefined && (
          <div className="flex items-center justify-between pt-1">
            <p
              id={`word-count-${question.id}`}
              className={`text-xs font-mono flex items-center gap-1.5 ${
                meetsMinimum
                  ? 'text-emerald-400 font-medium'
                  : rawAnswer.length > 0
                  ? 'text-amber-300'
                  : 'text-[#8D737A]'
              }`}
            >
              {meetsMinimum ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{wordCount} words (Minimum satisfied)</span>
                </>
              ) : (
                <span>
                  {wordCount} / {question.minWords} words required
                </span>
              )}
            </p>
            <span className="text-[10px] text-[#8D737A]">Min. {question.minWords} words</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.title} application`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#070305]/92 p-2.5 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-[1.75rem] border border-[#E8CBA4]/30 bg-gradient-to-b from-[#180811] via-[#12060D] to-[#0D0409] shadow-[0_30px_100px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        {/* Modal Top Header (Fixed at top) */}
        <div className="shrink-0 p-5 sm:p-7 border-b border-[#E8CBA4]/15 bg-[#170810]/95 backdrop-blur-md flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E8CBA4]/30 bg-[#1F0A16] shadow-[0_0_20px_rgba(212,175,106,0.15)] text-[#E8CBA4]">
              <TrackIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#E8CBA4]">
                  ICON MUN 2027
                </span>
                <span aria-hidden="true" className="text-[#8D737A]">·</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${config.badgeTone}`}>
                  {meta.title}
                </span>
              </div>
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold tracking-tight text-[#FFF5E8] text-balance">
                {meta.title} Application
              </h3>
              <p className="text-[11px] sm:text-xs text-[#D8C5C5] font-light truncate mt-0.5">
                {config.department}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close application dialog"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#E8CBA4]/35 bg-[#1C0A14] text-[#E8CBA4] transition-all hover:border-[#E8CBA4] hover:bg-[#280D1C] hover:text-[#FFF5E8] active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 overscroll-contain">
          {done ? (
            <div className="py-10 text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#E8CBA4] bg-[#E8CBA4]/10 shadow-[0_0_40px_rgba(212,175,106,0.3)] animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="h-10 w-10 text-[#E8CBA4]" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <span className="text-xs uppercase tracking-[0.3em] text-[#E8CBA4] font-semibold">
                  Submission Verified
                </span>
                <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#FFF5E8]">
                  Application Received
                </h3>
                <p className="text-sm font-light text-[#D8C5C5] leading-relaxed">
                  Thank you, <strong className="font-medium text-[#FFF5E8]">{fullName.trim() || 'Applicant'}</strong>. Your application for the <span className="text-[#E8CBA4] font-medium">{meta.title} Department</span> has been recorded directly with the Directorate.
                </p>
                <p className="text-xs text-[#8D737A]">
                  Confirmation and interview directives will be sent to <span className="text-[#FFF5E8] underline">{email.trim()}</span>.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="gold-btn-primary cursor-pointer rounded-xl px-10 py-3.5 text-xs font-bold uppercase tracking-widest shadow-xl transition-transform active:scale-95"
                >
                  Return to Conference
                </button>
              </div>
            </div>
          ) : (
            <form id="team-application-form" onSubmit={submit} className="space-y-6">
              {!isOpen && status && (
                <div role="alert" className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                  <span>
                    {status.state === 'upcoming'
                      ? `${status.detail}. You may preview questions below.`
                      : 'Applications for this role are currently closed.'}
                  </span>
                </div>
              )}

              {/* Section 1: Candidate Profile */}
              <div className="rounded-2xl border border-[#E8CBA4]/20 bg-[#15070F]/70 p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E8CBA4]/10">
                  <span className="font-mono text-xs text-[#E8CBA4] font-semibold">01</span>
                  <h4 className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#FFF5E8]">
                    Personal Information & Contact
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="applicant-full-name" className="text-[10px] uppercase tracking-[0.16em] text-[#D8C5C5] block mb-2 font-semibold">
                      Full Name *
                    </label>
                    <input
                      id="applicant-full-name"
                      required
                      maxLength={120}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Abdullah Al-Otaibi"
                      autoComplete="name"
                      className="w-full rounded-xl border border-[#E8CBA4]/25 bg-[#100609] px-4 py-3 min-h-[46px] text-sm text-[#FFF5E8] placeholder-[#8D737A] transition-all duration-200 focus:border-[#E8CBA4] focus:outline-none focus:ring-4 focus:ring-[#E8CBA4]/[0.08]"
                    />
                  </div>

                  <div>
                    <label htmlFor="applicant-email" className="text-[10px] uppercase tracking-[0.16em] text-[#D8C5C5] block mb-2 font-semibold">
                      Email Address *
                    </label>
                    <input
                      id="applicant-email"
                      type="email"
                      required
                      maxLength={160}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. delegate@institution.edu.sa"
                      autoComplete="email"
                      className="w-full rounded-xl border border-[#E8CBA4]/25 bg-[#100609] px-4 py-3 min-h-[46px] text-sm text-[#FFF5E8] placeholder-[#8D737A] transition-all duration-200 focus:border-[#E8CBA4] focus:outline-none focus:ring-4 focus:ring-[#E8CBA4]/[0.08]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="applicant-school" className="text-[10px] uppercase tracking-[0.16em] text-[#D8C5C5] block mb-2 font-semibold">
                      School / University *
                    </label>
                    <input
                      id="applicant-school"
                      required
                      maxLength={160}
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. King Saud University / British Int. School"
                      className="w-full rounded-xl border border-[#E8CBA4]/25 bg-[#100609] px-4 py-3 min-h-[46px] text-sm text-[#FFF5E8] placeholder-[#8D737A] transition-all duration-200 focus:border-[#E8CBA4] focus:outline-none focus:ring-4 focus:ring-[#E8CBA4]/[0.08]"
                    />
                  </div>

                  <div>
                    <PhoneInput
                      id="applicant-phone"
                      countryCode={countryCode}
                      phoneNumber={phone}
                      onCountryCodeChange={(code) => setCountryCode(code)}
                      onPhoneNumberChange={(num) => setPhone(num)}
                      label="Applicant Phone Number"
                      required
                      placeholder="5X XXX XXXX"
                      helperText="Default set to Saudi Arabia (+966 🇸🇦). Search for international codes."
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Department Questionnaire */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E8CBA4]/15">
                  <span className="font-mono text-xs text-[#E8CBA4] font-semibold">02</span>
                  <h4 className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#FFF5E8]">
                    {meta.title} Questionnaire & Qualifications
                  </h4>
                </div>

                {meta.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-[#E8CBA4]/15 bg-[#14060E]/60 p-4 sm:p-5 transition-all duration-200 hover:border-[#E8CBA4]/30 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label
                        htmlFor={`team-question-${question.id}`}
                        className="text-xs sm:text-sm font-medium text-[#FFF5E8] leading-snug"
                      >
                        <span className="text-[#E8CBA4] font-mono mr-1.5">{index + 1}.</span>
                        {question.prompt}
                        <span className="text-[#E8CBA4] ml-1">*</span>
                      </label>
                      {question.minWordsLabel && (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-[#E8CBA4]/30 bg-[#E8CBA4]/10 text-[#E8CBA4]">
                          {question.minWordsLabel}
                        </span>
                      )}
                    </div>

                    {renderQuestionControl(question, index)}
                  </div>
                ))}
              </div>

              {/* Privacy & Legal Consent */}
              <div className="rounded-2xl border border-[#E8CBA4]/20 bg-[#15070F]/80 p-4 sm:p-5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#E8CBA4]/40 bg-[#100609] text-[#E8CBA4] focus:ring-[#E8CBA4]/30 cursor-pointer accent-[#D4AF6A]"
                  />
                  <span className="text-[11px] sm:text-xs text-[#D8C5C5] leading-relaxed">
                    I confirm that all details provided are accurate. I have read and agree to the{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#E8CBA4] underline hover:text-[#FFF5E8]">
                      Privacy Policy & Minor Protection Terms
                    </a>{' '}
                    (including parental/guardian consent if under 18) and the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#E8CBA4] underline hover:text-[#FFF5E8]">
                      Terms of Participation
                    </a>.
                  </span>
                </label>
              </div>

              {/* Hidden Anti-Bot Honeypot */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </label>
              </div>
            </form>
          )}
        </div>

        {/* Modal Bottom Footer (Fixed at bottom) */}
        {!done && (
          <div className="shrink-0 p-4 sm:p-6 border-t border-[#E8CBA4]/15 bg-[#14060E]/95 backdrop-blur-md">
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in duration-150"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-[10px] sm:text-[11px] leading-relaxed text-[#8D737A]">
                Submitted directly to the ICON MUN 2027 High Secretariat. Data is encrypted and private.
              </p>

              <div className="flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-[44px] cursor-pointer items-center justify-center px-4 py-2.5 text-xs uppercase tracking-wider text-[#D8C5C5] hover:text-[#FFF5E8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="team-application-form"
                  disabled={sending || !isOpen}
                  className="gold-btn-primary flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl px-7 py-3 text-xs font-bold uppercase tracking-widest shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-[#12050A] border-t-transparent animate-spin" />
                      <span>Transmitting…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
