import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ACCEPTED_TYPES, MAX_PROOFS, checkProofFile } from '../lib/proofs';

/**
 * Lets an applicant attach up to 10 photos of certificates / awards as proof of experience.
 * The whole box is a button (tap or click to choose photos) and also accepts dropped files.
 * Files stay on the device until the form is submitted.
 */
export const ProofUploader: React.FC<{
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}> = ({ files, onChange, disabled, label = 'Certificates or proof of experience (optional)' }) => {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState('');
  const [dragging, setDragging] = useState(false);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const add = (picked: FileList | File[] | null) => {
    if (!picked) return;
    const next = [...files];
    let msg = '';
    for (const f of Array.from(picked)) {
      if (next.length >= MAX_PROOFS) { msg = `You can attach up to ${MAX_PROOFS} images.`; break; }
      const bad = checkProofFile(f);
      if (bad) { msg = bad; continue; }
      next.push(f);
    }
    setProblem(msg);
    onChange(next);
    if (input.current) input.current.value = '';
  };

  const full = files.length >= MAX_PROOFS;

  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[#B59B9F]">{label}</div>
      <p className="mb-3 text-[11px] leading-relaxed text-[#8D737A]">
        Photos of certificates, awards or conference badges that show your experience. Only the organisers can see them.
      </p>

      <button
        type="button"
        disabled={disabled || full}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled && !full) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled && !full) add(e.dataTransfer.files); }}
        className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-[background-color,border-color,transform] duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
          dragging ? 'border-[#E8CBA4] bg-[#E8CBA4]/15' : 'border-[#E8CBA4]/40 bg-black/20 hover:border-[#E8CBA4]/70 hover:bg-[#E8CBA4]/10'
        }`}
      >
        <ImagePlus className="h-6 w-6 text-[#E8CBA4]" aria-hidden="true" />
        <span className="text-sm font-medium text-[#F0E8E2]">{full ? 'Maximum images attached' : files.length ? 'Add more photos' : 'Tap to add photos'}</span>
        <span className="text-[11px] text-[#8D737A]">JPG, PNG or WebP · up to {MAX_PROOFS} images · {files.length}/{MAX_PROOFS} attached</span>
      </button>

      {files.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {files.map((f, i) => (
            <li key={previews[i]} className="relative aspect-square overflow-hidden rounded-lg border border-[#E8CBA4]/25 bg-black/30 animate-in fade-in zoom-in-95 duration-200">
              <img src={previews[i]} alt={`Selected image ${i + 1}: ${f.name}`} className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={disabled}
                onClick={() => { setProblem(''); onChange(files.filter((_, j) => j !== i)); }}
                aria-label={`Remove ${f.name}`}
                className="absolute right-1 top-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/75 text-white transition-colors hover:bg-black"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input ref={input} type="file" accept={ACCEPTED_TYPES.join(',')} multiple className="sr-only" tabIndex={-1} onChange={(e) => add(e.target.files)} />
      {problem && <p role="alert" className="mt-2 text-xs text-rose-300">{problem}</p>}
    </div>
  );
};
