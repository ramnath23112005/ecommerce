import { create } from 'zustand';
import { cartAPI } from '@/lib/api';

interface CartItem {
  product: any;
  variant: string;
  quantity: number;
  price: number;
}

interface CartState {
  cart: { items: CartItem[]; totalAmount: number; totalItems: number; coupon?: string; discount: number } | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, variantId: string, quantity: number) => Promise<void>;
  updateItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const { data } = await cartAPI.get();
      set({ cart: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, variantId, quantity) => {
    const { data } = await cartAPI.addItem({ productId, variantId, quantity });
    set({ cart: data.data });
  },

  updateItem: async (variantId, quantity) => {
    const { data } = await cartAPI.updateItem(variantId, quantity);
    set({ cart: data.data });
  },

  removeItem: async (variantId) => {
    const { data } = await cartAPI.removeItem(variantId);
    set({ cart: data.data });
  },

  clearCart: async () => {
    await cartAPI.clear();
    set({ cart: { items: [], totalAmount: 0, totalItems: 0, discount: 0 } });
  },

  applyCoupon: async (code) => {
    const { data } = await cartAPI.applyCoupon(code);
    set({ cart: data.data });
  },

  removeCoupon: async () => {
    const { data } = await cartAPI.removeCoupon();
    set({ cart: data.data });
  },
}));
