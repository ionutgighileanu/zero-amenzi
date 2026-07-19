"use client";

import { useEffect, useRef, useState } from "react";

const UNDO_WINDOW_MS = 30_000;

type SoftDeletable = { id: string; deleted_at: string | null };

/**
 * Soft-delete cu fereastră de Undo de 30s (vezi CLAUDE.md).
 * Ștergerea setează `deleted_at`; rândurile marcate sunt excluse din `visible`.
 */
export function useSoftDelete<T extends SoftDeletable>(initial: T[]) {
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
  };

  const undo = (id: string) => {
    clearPendingTimeout();
    setPendingId(null);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, deleted_at: null } : it))
    );
  };

  const visible = items.filter((it) => it.deleted_at === null);
  const pendingItem = items.find((it) => it.id === pendingId) ?? null;

  return { items, setItems, visible, pendingItem, softDelete, undo };
}
