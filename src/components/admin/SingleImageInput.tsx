'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { uploadImage, ApiError } from '@/lib/admin-client';
import { TrashIcon, UploadIcon } from '@/components/ui/Icons';

/** Single optional image: upload → media id, with remove button. */
export default function SingleImageInput({
  mediaId,
  onChange,
  label,
  aspect = 'w-28 h-28'
}: {
  mediaId: number | null;
  onChange: (id: number | null) => void;
  label: string;
  aspect?: string;
}) {
  const t = useTranslations('admin.common');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'fileTooLarge' || err.code === 'invalidFileType')) {
        setError(t(err.code));
      } else {
        setError(t('uploadFailed'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="admin-label">{label}</label>
      <div className="mt-1">
        {mediaId !== null ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/media/${mediaId}`}
              alt=""
              className={`${aspect} object-cover border border-line bg-ivory`}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -top-2 -end-2 bg-night text-ivory p-1"
              aria-label={t('delete')}
            >
              <TrashIcon size={12} />
            </button>
          </div>
        ) : (
          <label
            className={`${aspect} border border-dashed border-line hover:border-ink transition-colors flex flex-col items-center justify-center gap-1 text-stone hover:text-ink cursor-pointer`}
          >
            <UploadIcon size={18} />
            <span className="text-[10px]">{busy ? '…' : '+'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-[#8c2f2f]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
