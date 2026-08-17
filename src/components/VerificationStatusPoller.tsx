"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VERIFICATION_POLL_MAX_HOURS, VERIFICATION_POLL_SECONDS } from "@/lib/constants";

const HOUR_MS = 3_600_000;

/**
 * Întreabă /api/verificare/status/[id] la fiecare VERIFICATION_POLL_SECONDS
 * cât timp cererea e „în procesare". Când endpoint-ul raportează „completa",
 * cere un refresh al Server Component-ului părinte — randarea rămâne într-un
 * singur loc (pagina), aici e doar declanșatorul.
 *
 * Se oprește definitiv după VERIFICATION_POLL_MAX_HOURS de la trimitere: un
 * tab uitat deschis pe o cerere care n-a primit niciodată răspuns nu trebuie
 * să întrebe la nesfârșit.
 */
export function VerificationStatusPoller({ id, createdAt }: { id: string; createdAt: string }) {
  const router = useRouter();
  const deadline = new Date(createdAt).getTime() + VERIFICATION_POLL_MAX_HOURS * HOUR_MS;
  const [stopped, setStopped] = useState(() => Date.now() >= deadline);

  useEffect(() => {
    if (stopped) return;

    const tick = async () => {
      if (Date.now() >= deadline) {
        setStopped(true);
        return;
      }
      try {
        // Fără `cache: "no-store"`: endpoint-ul trimite `max-age=30`, iar
        // intervalul de polling e mai lung, deci cache-ul browserului e
        // mereu expirat la următoarea întrebare — nu servește date vechi.
        const res = await fetch(`/api/verificare/status/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "completa") router.refresh();
      } catch {
        // Rețea picată sau răspuns invalid — reîncercăm la următorul ciclu.
      }
    };

    const interval = setInterval(tick, VERIFICATION_POLL_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [id, deadline, stopped, router]);

  if (stopped) {
    return (
      <p className="text-xs text-slate-500 mt-3">
        Am oprit verificarea automată după {VERIFICATION_POLL_MAX_HOURS} de ore.
        Reîncarcă pagina ca să vezi dacă între timp a apărut rezultatul.
      </p>
    );
  }

  return (
    <p className="text-xs text-slate-500 mt-3">
      Nu închide tabul — verificăm automat în fiecare minut.
    </p>
  );
}
