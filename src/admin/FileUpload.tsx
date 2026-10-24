import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button, TextInput, friendlyError, useToast } from './ui';
import { getSupabase } from '../lib/supabase';

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

/** Uploads to the admin-only "site-files" storage bucket and returns the public URL. */
export const FileUpload: React.FC<{ value: string; onChange: (url: string) => void; folder: string }> = ({ value, onChange, folder }) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!ALLOWED.includes(file.type)) return toast('err', 'Please choose a PNG, JPG or WebP image.');
    if (file.size > MAX_BYTES) return toast('err', 'That file is larger than 15 MB.');
    const sbP = getSupabase();
    if (!sbP) return toast('err', 'Supabase is not configured.');
    setBusy(true);
    try {
      const sb = await sbP;
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const safe = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40) || 'image';
      const path = `${folder}/${Date.now()}-${safe}.${ext}`;
      const { error } = await sb.storage.from('site-files').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = sb.storage.from('site-files').getPublicUrl(path);
      onChange(data.publicUrl);
      toast('ok', 'Image uploaded. Remember to save.');
    } catch (e) {
      toast('err', friendlyError(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D4AF6A]/40 bg-[#121212]">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-[#6F685B]" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" accept={ALLOWED.join(',')} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Button size="sm" variant="subtle" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {value ? 'Replace image' : 'Upload image'}
          </Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange('')}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL / path (e.g. /assets/photo.jpg)" maxLength={500} aria-label="Image URL" />
    </div>
  );
};
