"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type CompareListing = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  primary_image_url: string | null;
  condition: string | null;
  category?: { name: string; slug?: string; icon?: string | null } | null;
  location?: { name: string } | null;
  description?: string | null;
  is_promoted?: boolean;
  is_urgent?: boolean;
};

type CompareContextValue = {
  items: CompareListing[];
  add: (listing: CompareListing) => void;
  remove: (id: string) => void;
  clear: () => void;
  isCompared: (id: string) => boolean;
  isFull: boolean;
};

const MAX = 3;

const CompareContext = createContext<CompareContextValue>({
  items: [],
  add: () => {},
  remove: () => {},
  clear: () => {},
  isCompared: () => false,
  isFull: false,
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareListing[]>([]);

  const add = useCallback((listing: CompareListing) => {
    setItems((prev) => {
      if (prev.length >= MAX || prev.some((l) => l.id === listing.id))
        return prev;
      return [...prev, listing];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isCompared = useCallback(
    (id: string) => items.some((l) => l.id === id),
    [items],
  );

  return (
    <CompareContext.Provider
      value={{ items, add, remove, clear, isCompared, isFull: items.length >= MAX }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
