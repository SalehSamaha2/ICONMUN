import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ACCEPTED_TYPES, MAX_PROOFS, checkProofFile } from '../lib/proofs';

/**
 * Lets an applicant attach up to 5 photos of certificates / awards as proof of experience.
 * The files stay on the device until the form is submitted.
 */
export const ProofUploader: React.FC<{
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}> = ({ files, onChange, disabled, label = 'Certificates or proof of experience (optional)' }) => {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState('');
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const add = (picked: FileList | null) => {
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

  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[#B59B9F]">{label}</div>
      <p className="mb-3 text-[11px] leading-relaxed text-[#8D737A]">
        Photos of certificates, awards or conference badges that show your experience. Up to {MAX_PROOFS} images (JPG, PNG or WebP). Only the organisers can see them.
      </p>
      <div className="flex flex-wrap gap-3">
        {files.map((f, i) => (
          <div key={previews[i]} className="relative h-20 w-20 overflow-hidden rounded-lg border border-[#E8CBA4]/25 bg-black/30">
            <img src={previews[i]} alt={`Selected image ${i + 1}: ${f.name}`} className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={disabled}
              onClick={() => { setProblem(''); onChange(files.filter((_, j) => j !== i)); }}
              aria-label={`Remove ${f.name}`}
              className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/75 text-white transition-colors hover:bg-black"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {files.length < MAX_PROOFS && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => input.current?.click()}
            className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#E8CBA4]/40 text-[11px] text-[#E8CBA4] transition-colors hover:bg-[#E8CBA4]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" /> Add
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPTED_TYPES.join(',')} multiple className="sr-only" tabIndex={-1} onChange={(e) => add(e.target.files)} />
      {problem && <p role="alert" className="mt-2 text-xs text-rose-300">{problem}</p>}
    </div>
  );
};
