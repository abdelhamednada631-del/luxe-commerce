import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MediaGalleryDialog from '@/components/admin/MediaGalleryDialog';
import { api } from '@/lib/admin-client';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values?.id ? `${key}-${values.id}` : key
}));

vi.mock('@/lib/admin-client', () => ({
  api: { get: vi.fn() }
}));

const media = [
  { id: 10, filename: 'selected.webp', mime: 'image/webp', width: 800, height: 1200, size_bytes: 1200, usedCount: 1 },
  { id: 12, filename: 'look.webp', mime: 'image/webp', width: 800, height: 1200, size_bytes: 1200, usedCount: 0 },
  { id: 15, filename: 'detail.webp', mime: 'image/webp', width: 800, height: 1200, size_bytes: 1200, usedCount: 0 }
];

describe('MediaGalleryDialog', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ media });
  });

  it('does not offer an already selected image or exceed the parent capacity', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <MediaGalleryDialog open onClose={vi.fn()} selectedMediaIds={[10]} maxSelections={2} onAdd={onAdd} />
    );

    await screen.findByRole('button', { name: 'selectMedia-12' });
    expect(screen.queryByRole('button', { name: 'selectMedia-10' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'selectMedia-12' }));
    expect(screen.getByRole('button', { name: 'selectMedia-15' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'addGallerySelection' }));
    expect(onAdd).toHaveBeenCalledWith([12]);
  });
});
