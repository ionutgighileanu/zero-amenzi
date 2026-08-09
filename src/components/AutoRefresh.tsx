"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Reîmprospătează datele Server Component-ului părinte la un interval fix,
 * fără reload de pagină — folosit pe /verificare/[token] cât timp starea
 * e „pending" (vezi PRD §5.1: „pagina se actualizează automat când e gata"). */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [seconds, router]);

  return null;
}
