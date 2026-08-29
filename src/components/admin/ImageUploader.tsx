'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { uploadImage, ApiError } from '@/lib/admin-client';
import { UploadIcon, TrashIcon } from '@/components/ui/Icons';

/**
 * Multi-image uploader for admin forms.
 * Uploads through the media pipeline (validated + deduped server-side)
 * and exposes the ordered media ids to the parent form.
 */
export default function ImageUploader({
  mediaIds,
  onChange,
  max = 10,
  hint
}: {
  mediaIds: number[];
  onChange: (ids: number[]) => void;
  max?: number;
  hint?: string;
}) {
  const t = useTranslations('admin.common');
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');
    setBusy(true);
    try {
      const next = [...mediaIds];
      for (const file of Array.from(files).slice(0, max - mediaIds.length)) {
        const id = await uploadImage(file);
        next.push(id);
      }
      onChange(next);
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'fileTooLarge' || err.code === 'invalidFileType')) {
        setError(t(err.code));
      } else {
        setError(t('uploadFailed'));
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAt(index: number) {
    onChange(mediaIds.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...mediaIds];
    const [item] = next.splice(index, 1);
    onChange([item, ...next]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {mediaIds.map((id, i) => (
          <div key={id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/media/${id}`}
              alt=""
              className="w-20 h-24 object-cover border border-line bg-ivory"
              loading="lazy"
            />
            {i === 0 ? (
              <span className="absolute top-0 start-0 bg-ink text-porcelain text-[10px] px-1.5 py-0.5">
                ★
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-night/80">
              {i > 0 ? (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  className="text-[10px] text-ivory px-1.5 py-1"
                >
                  ★
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="text-[10px] text-ivory px-1.5 py-1"
                aria-label={t('delete')}
              >
                <TrashIcon size={12} />
              </button>
            </div>
          </div>
        ))}

        {mediaIds.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-20 h-24 border border-dashed border-line hover:border-ink transition-colors flex flex-col items-center justify-center gap-1 text-stone hover:text-ink disabled:opacity-50"
          >
            <UploadIcon size={18} />
            <span className="text-[10px]">{busy ? '…' : '+'}</span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {hint ? <p className="mt-2 text-xs text-stone">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-[#8c2f2f]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
