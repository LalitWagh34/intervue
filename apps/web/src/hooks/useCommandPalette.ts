import { create } from "zustand";

interface CommandPaletteState {
  isOpen: boolean;
  returnFocus: HTMLElement | null;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  isOpen: false,
  returnFocus: null,
  setIsOpen: (isOpen) =>
    set((state) => ({
      isOpen,
      returnFocus:
        isOpen && typeof document !== "undefined" && document.activeElement instanceof HTMLElement
          ? document.activeElement
          : state.returnFocus,
    })),
  toggle: () =>
    set((state) => {
      const isOpen = !state.isOpen;
      return {
        isOpen,
        returnFocus:
          isOpen && typeof document !== "undefined" && document.activeElement instanceof HTMLElement
            ? document.activeElement
            : state.returnFocus,
      };
    }),
}));
