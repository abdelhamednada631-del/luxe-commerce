import { describe, expect, it } from 'vitest';
import { addMediaIds, moveMediaId, remainingImageSlots } from '@/components/admin/media-selection';

describe('media selection rules', () => {
  it('adds only new media IDs within the remaining capacity', () => {
    expect(addMediaIds([2, 4], [4, 7, 8], 4)).toEqual([2, 4, 7, 8]);
  });

  it('keeps the current selection when it is already at capacity', () => {
    expect(addMediaIds([2, 4], [7], 2)).toEqual([2, 4]);
  });

  it('moves an image to the selected cover position without losing any ID', () => {
    expect(moveMediaId([2, 4, 7], 2, 0)).toEqual([7, 2, 4]);
  });

  it('ignores movement outside the selected list', () => {
    expect(moveMediaId([2, 4, 7], 1, 6)).toEqual([2, 4, 7]);
  });

  it('reports the remaining image capacity without returning a negative number', () => {
    expect(remainingImageSlots([2, 4], 5)).toBe(3);
    expect(remainingImageSlots([2, 4, 7], 2)).toBe(0);
  });
});
