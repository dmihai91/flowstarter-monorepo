import { create } from 'zustand';

interface EcommerceWaitlistState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useEcommerceWaitlist = create<EcommerceWaitlistState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
