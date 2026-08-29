'use client';

import { useState } from 'react';
import SmartImage from '@/components/ui/SmartImage';

/**
 * Product image gallery — calm crossfade between stacked layers,
 * hairline thumbnails beneath. RTL-safe (no directional assumptions).
 */
export default function ProductGallery({ images, alt }: { images: number[]; alt: string }) {
  const [active, setActive] = useState(0);
  const count = images.length;

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-[3/4] bg-ivory overflow-hidden border border-line/50">
        {count === 0 ? (
          <SmartImage mediaId={null} alt={alt} sizes="(max-width: 1024px) 100vw, 50vw" priority />
        ) : (
          images.map((id, i) => (
            <div
              key={`${id}-${i}`}
              aria-hidden={i !== active}
              className={`absolute inset-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <SmartImage
                mediaId={id}
                alt={i === active ? alt : ''}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={i === 0}
              />
            </div>
          ))
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={alt}>
          {images.map((id, i) => (
            <button
              key={`${id}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`relative aspect-[3/4] w-16 shrink-0 border overflow-hidden transition-colors duration-300 ${
                i === active ? 'border-ink' : 'border-transparent hover:border-line'
              }`}
            >
              <SmartImage mediaId={id} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
