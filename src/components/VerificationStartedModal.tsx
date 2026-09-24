"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { attachVerificationEmailAction } from "@/lib/actions/verification";

/** Verificare permisivă, doar cât să prindem greșelile evidente înainte de
 * trimitere. Validarea strictă rămâne pe server (src/lib/validation/
 * verification.ts) — asta e doar ca utilizatorul să afle imediat, nu după ce
 * a fost deja navigat mai departe. */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Separat de VerificationForm.tsx și încărcat cu `next/dynamic({ ssr: false })`
 * din acolo, ca `Modal` (deci și `motion/react`, ~120 KB) să nu mai intre în
 * bundle-ul inițial al landing-ului și al /verificare — apare doar după ce
 * cineva chiar trimite formularul, nu la fiecare vizită.
 */
export default function VerificationStartedModal({
  plate,
  id,
  token,
  onClose,
}: {
  plate: string;
  id: string;
  token: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  const openProgress = async () => {
    const trimmed = email.trim();

    // Fără verificarea asta, acțiunea de pe server respingea tăcut un email
    // invalid (safeParse eșua și ieșea din funcție), iar utilizatorul era dus
    // mai departe crezând că va primi rezultatul pe email. Nu-l primea
    // niciodată și nu afla de ce.
    if (trimmed && !EMAIL_PATTERN.test(trimmed)) {
      setEmailError("Adresa de email nu pare validă. Verific-o sau lasă câmpul gol.");
      return;
    }

    setEmailError(null);
    setNavigating(true);
    // Emailul se atașează prin token (RPC-ul e keyed pe token, vezi migrarea);
    // navigarea folosește id-ul, care e identificatorul paginii de status.
    if (trimmed) {
      await attachVerificationEmailAction(token, trimmed);
    }
    router.push(`/verificare/status/${id}`);
  };

  return (
    <Modal onClose={onClose} title="Verificarea a pornit">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Verificăm actele pentru <strong>{plate}</strong>. Îți trimitem rezultatul pe email
          de îndată ce e gata.
        </p>
        <div>
          <Input
            label="Email"
            type="email"
            placeholder="email@exemplu.ro (opțional)"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            disabled={navigating}
            aria-invalid={emailError !== null}
            aria-describedby={emailError ? "email-eroare" : undefined}
          />
          {emailError && (
            <p id="email-eroare" className="text-sm text-red-600 mt-1.5" role="alert">
              {emailError}
            </p>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1" disabled={navigating}>
            Închide
          </Button>
          <Button size="sm" className="flex-1" onClick={openProgress} disabled={navigating}>
            {navigating ? "Se deschide…" : "Deschide pagina de progres"}
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Salvează linkul dacă nu lași email — e singurul mod să revii la rezultat.
        </p>
      </div>
    </Modal>
  );
}
