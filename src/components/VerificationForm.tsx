"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  createVerificationRequestAction,
  type CreateVerificationState,
} from "@/lib/actions/verification";
import { isValidRoPlateInput, sanitizePlateInput } from "@/lib/plate";
import { PLATE_INVALID_MESSAGE, RO_PLATE_INPUT_MAX_LENGTH } from "@/lib/constants";

// Vezi comentariul din VerificationStartedModal.tsx: `Modal` importă
// `motion/react` (~120 KB), care altfel ar intra în bundle-ul inițial al
// landing-ului doar pentru un ecran pe care majoritatea vizitatorilor nu-l
// văd niciodată la prima vizită. `ssr: false` fiindcă apare doar după o
// interacțiune client (trimiterea formularului), nu are ce randa pe server.
const VerificationStartedModal = dynamic(() => import("@/components/VerificationStartedModal"), {
  ssr: false,
});

const initialState: CreateVerificationState = { status: "idle" };

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
