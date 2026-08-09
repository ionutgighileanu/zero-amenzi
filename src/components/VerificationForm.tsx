"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { BRAND_BLUE } from "@/lib/constants";
import {
  attachVerificationEmailAction,
  createVerificationRequestAction,
  type CreateVerificationState,
} from "@/lib/actions/verification";

const initialState: CreateVerificationState = { status: "idle" };

export function VerificationForm() {
  const [state, formAction, pending] = useActionState(createVerificationRequestAction, initialState);
  const [dismissed, setDismissed] = useState(false);

  const showModal = state.status === "created" && !dismissed;

  return (
    <div className="max-w-md">
      <form action={formAction} className="flex gap-2" onSubmit={() => setDismissed(false)}>
        <div className="flex-1 relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-8 rounded-l-xl flex items-center justify-center text-white text-[9px] font-bold"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            <div className="flex flex-col items-center leading-none gap-0.5">
              <span className="text-[6px]">★</span>
              <span>RO</span>
            </div>
          </div>
          <input
            name="plate"
            placeholder="B 100 ABC"
            disabled={pending}
            style={{ textTransform: "uppercase" }}
            className="w-full border border-slate-300 rounded-xl pl-11 pr-3 py-3 text-base font-bold tracking-wider text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 disabled:bg-slate-50 font-display"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          <Search size={18} className="mr-2" />
          {pending ? "Se trimite…" : "Verifică"}
        </Button>
      </form>

      {state.status === "error" && (
        <div
          className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"
          role="alert"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {showModal && state.status === "created" && (
        <VerificationStartedModal
          plate={state.plate}
          token={state.token}
          onClose={() => setDismissed(true)}
        />
      )}
    </div>
  );
}

function VerificationStartedModal({
  plate,
  token,
  onClose,
}: {
  plate: string;
  token: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [navigating, setNavigating] = useState(false);

  const openProgress = async () => {
    setNavigating(true);
    if (email.trim()) {
      await attachVerificationEmailAction(token, email);
    }
    router.push(`/verificare/${token}`);
  };

  return (
    <Modal onClose={onClose} title="Verificarea a pornit">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Verificăm actele pentru <strong>{plate}</strong>. Îți trimitem rezultatul pe email
          de îndată ce e gata.
        </p>
        <Input
          label="Email"
          type="email"
          placeholder="email@exemplu.ro (opțional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={navigating}
        />
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
