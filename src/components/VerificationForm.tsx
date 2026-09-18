"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  attachVerificationEmailAction,
  createVerificationRequestAction,
  type CreateVerificationState,
} from "@/lib/actions/verification";
import { isValidRoPlateInput, sanitizePlateInput } from "@/lib/plate";
import { PLATE_INVALID_MESSAGE, RO_PLATE_INPUT_MAX_LENGTH } from "@/lib/constants";

const initialState: CreateVerificationState = { status: "idle" };

/** Verificare permisivă, doar cât să prindem greșelile evidente înainte de
 * trimitere. Validarea strictă rămâne pe server (src/lib/validation/
 * verification.ts) — asta e doar ca utilizatorul să afle imediat, nu după ce
 * a fost deja navigat mai departe. */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function VerificationForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createVerificationRequestAction, initialState);
  const [dismissed, setDismissed] = useState(false);
  const [plate, setPlate] = useState("");

  // Validare live: eroarea apare cât timp omul a scris ceva care nu poate fi
  // plăcuță, iar butonul stă dezactivat — nu mai află abia după „Verifică".
  // Serverul validează oricum din nou (src/lib/validation/verification.ts).
  const plateValid = isValidRoPlateInput(plate);
  const showPlateError = plate.length > 0 && !plateValid;

  // Autentificat: îi știm deja emailul din cont și cererea e legată de el,
  // deci nu mai are ce completa — trecem direct la pagina de status.
  const created = state.status === "created" ? state : null;
  const skipEmailPrompt = created?.hasAccount ?? false;

  useEffect(() => {
    if (created && skipEmailPrompt) router.push(`/verificare/status/${created.id}`);
  }, [created, skipEmailPrompt, router]);

  const showModal = created !== null && !skipEmailPrompt && !dismissed;

  return (
    <div className="max-w-md">
      <form action={formAction} className="flex gap-2" onSubmit={() => setDismissed(false)}>
        <div className="flex-1 relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 rounded-l-xl bg-brand flex items-center justify-center text-white text-[9px] font-bold">
            <div className="flex flex-col items-center leading-none gap-0.5">
              <span className="text-[6px]">★</span>
              <span>RO</span>
            </div>
          </div>
          <label htmlFor="plate" className="sr-only">
            Număr de înmatriculare
          </label>
          <input
            id="plate"
            name="plate"
            placeholder="B 100 ABC"
            value={plate}
            onChange={(e) => setPlate(sanitizePlateInput(e.target.value))}
            maxLength={RO_PLATE_INPUT_MAX_LENGTH}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
            aria-invalid={showPlateError}
            aria-describedby={showPlateError ? "plate-eroare" : undefined}
            className={`w-full border rounded-xl pl-11 pr-3 py-3 text-base font-bold tracking-wider text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 disabled:bg-slate-50 font-display ${showPlateError ? "border-red-400 focus:ring-red-600 focus:border-red-600" : "border-slate-300 focus:ring-blue-700 focus:border-blue-700"}`}
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={pending || !plateValid}>
          <Search size={18} className="mr-2" />
          {pending ? "Se trimite…" : "Verifică"}
        </Button>
      </form>

      {showPlateError && (
        <p id="plate-eroare" className="mt-2 text-sm text-red-600" role="alert">
          {PLATE_INVALID_MESSAGE}
        </p>
      )}

      {state.status === "error" && (
        <div
          className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"
          role="alert"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {showModal && created && (
        <VerificationStartedModal
          plate={created.plate}
          id={created.id}
          token={created.token}
          onClose={() => setDismissed(true)}
        />
      )}
    </div>
  );
}

function VerificationStartedModal({
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
