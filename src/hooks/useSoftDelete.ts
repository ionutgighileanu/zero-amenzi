"use client";

import { useEffect, useRef, useState } from "react";

const UNDO_WINDOW_MS = 30_000;

type SoftDeletable = { id: string; deleted_at: string | null };

type Persist = {
  /** Persistă ștergerea pe server. Dacă respinge, ștergerea locală e anulată. */
  onDelete?: (id: string) => Promise<void>;
  /** Persistă anularea pe server. Dacă respinge, revenim la starea ștearsă. */
  onUndo?: (id: string) => Promise<void>;
};

/**
 * Soft-delete cu fereastră de Undo de 30s (vezi CLAUDE.md).
 * Ștergerea setează `deleted_at` local (optimist) și persistă pe server;
 * rândurile marcate sunt excluse din `visible`. Eșecul persistenței revine
 * la starea anterioară, ca lista să nu mintă despre ce s-a salvat.
 */
export function useSoftDelete<T extends SoftDeletable>(initial: T[], persist: Persist = {}) {
  const [items, setItems] = useState<T[]>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const softDelete = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, deleted_at: new Date().toISOString() } : it
      )
    );
    setPendingId(id);
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setPendingId((current) => (current === id ? null : current));
    }, UNDO_WINDOW_MS);

    persist.onDelete?.(id).catch(() => {
      clearPendingTimeout();
      setPendingId((current) => (current === id ? null : current));
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, deleted_at: null } : it)));
    });
  };

  const undo = (id: string) => {
    clearPendingTimeout();
    setPendingId(null);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, deleted_at: null } : it))
    );

    persist.onUndo?.(id).catch(() => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, deleted_at: new Date().toISOString() } : it
        )
      );
    });
  };

  const visible = items.filter((it) => it.deleted_at === null);
  const pendingItem = items.find((it) => it.id === pendingId) ?? null;

  return { items, setItems, visible, pendingItem, softDelete, undo };
}
