import type { ReactNode } from 'react';

/** Labeled admin form field with optional inline error. */
export default function Field({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-[#8c2f2f]">{error}</p> : null}
    </div>
  );
}
