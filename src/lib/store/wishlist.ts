'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  productId: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  imageId: number | null;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (productId: number) => void;
  has: (productId: number) => boolean;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((state) => ({
          items: state.items.some((i) => i.productId === item.productId)
            ? state.items.filter((i) => i.productId !== item.productId)
            : [...state.items, item]
        })),
      remove: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      has: (productId) => get().items.some((i) => i.productId === productId)
    }),
    { name: 'luxe-wishlist' }
  )
);
