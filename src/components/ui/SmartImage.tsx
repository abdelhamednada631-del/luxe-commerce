'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Image with graceful broken-image fallback in the luxury language:
 * a calm porcelain tile with a hairline border and subtle mark.
 */
export default function SmartImage({
  mediaId,
  alt,
  className = '',
  imgClassName = '',
  fill = true,
  width,
  height,
  sizes = '(max-width: 768px) 100vw, 33vw',
  priority = false
}: {
  mediaId: number | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!mediaId || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-ivory ${className}`}
        style={!fill ? { width, height } : undefined}
        aria-label={alt}
        role="img"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="8" y="10" width="24" height="20" stroke="#C9C2B6" strokeWidth="1" />
          <circle cx="16" cy="17" r="2" stroke="#C9C2B6" strokeWidth="1" />
          <path d="M8 26l7-6 5 4 6-5 6 5" stroke="#C9C2B6" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={`/api/media/${mediaId}`}
      alt={alt}
      className={imgClassName}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
