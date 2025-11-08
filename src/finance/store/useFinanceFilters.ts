import { create } from 'zustand';
import type { TxnType } from '../types';

type State = {
  text?: string;
  fromISO?: string;
  toISO?: string;
  type?: TxnType;
  month?: string;
};

type Actions = {
  setText: (v?: string) => void;
  setFromISO: (v?: string) => void;
  setToISO: (v?: string) => void;
  setType: (v?: TxnType) => void;
  setMonth: (m: string) => void;
  reset: () => void;
};

const STORAGE_KEY = 'finance_filters_v1';

const saved = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<State>) : {};
  } catch {
    return {};
  }
})();

const useFinanceFilters = create<State & Actions>((set, get) => ({
  text: saved.text,
  fromISO: saved.fromISO,
  toISO: saved.toISO,
  type: saved.type,
  month: saved.month,
  setText: (v) => set({ text: v }),
  setFromISO: (v) => set({ fromISO: v }),
  setToISO: (v) => set({ toISO: v }),
  setType: (v) => set({ type: v }),
  setMonth: (m) => set({ month: m }),
  reset: () => set({ text: undefined, fromISO: undefined, toISO: undefined, type: undefined }),
}));

useFinanceFilters.subscribe((state) => {
  try {
    const { text, fromISO, toISO, type, month } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, fromISO, toISO, type, month }));
  } catch {}
});

export default useFinanceFilters;

