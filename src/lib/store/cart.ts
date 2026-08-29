'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  imageId: number | null;
  /** Bilingual so the cart renders correctly after a locale switch. */
  variantSelections: {
    variantId: string;
    labelEn: string;
    labelAr: string;
    optionId: string;
    optionValueEn: string;
    optionValueAr: string;
  }[];
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: number, variantKey: string) => void;
  setQuantity: (productId: number, variantKey: string, quantity: number) => void;
  clear: () => void;
}

/** Stable identity for a product+variant combination. */
export function variantKey(selections: { variantId: string; optionId: string }[]): string {
  return [...selections].sort((a, b) => a.variantId.localeCompare(b.variantId)).map((s) => `${s.variantId}:${s.optionId}`).join('|');
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const key = variantKey(item.variantSelections);
          const existing = state.items.find(
            (i) => i.productId === item.productId && variantKey(i.variantSelections) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i === existing ? { ...i, quantity: Math.min(i.quantity + quantity, 50) } : i
              )
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (productId, key) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && variantKey(i.variantSelections) === key)
          )
        })),
      setQuantity: (productId, key, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId && variantKey(i.variantSelections) === key
                ? { ...i, quantity: Math.max(1, Math.min(quantity, 50)) }
                : i
            )
            .filter((i) => i.quantity > 0)
        })),
      clear: () => set({ items: [] })
    }),
    { name: 'luxe-cart' }
  )
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
