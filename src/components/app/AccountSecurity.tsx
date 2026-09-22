"use client";

import { useState, useTransition } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteAccountAction, signOutEverywhereAction } from "@/lib/actions/account";
import { DELETE_CONFIRMATION_WORD, isDeleteConfirmed } from "@/lib/validation/account";

type AccountSecurityProps = {
  /** Flotele deținute de utilizator — dispar odată cu contul, inclusiv
   * pentru ceilalți membri, deci trebuie numite explicit înainte. */
  ownedFleetNames: string[];
};

export function AccountSecurity({ ownedFleetNames }: AccountSecurityProps) {
  const [signOutArmed, setSignOutArmed] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  // Fără try/catch în jurul acțiunilor: la succes fac redirect(), care
  // funcționează aruncând intern — un catch l-ar înghiți.
  const signOutEverywhere = () => startSignOut(() => signOutEverywhereAction());

  const deleteAccount = () => {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteAccountAction(confirmation);
      if (!result.ok) setDeleteError(result.error);
    });
  };

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-slate-800">Deconectare de pe toate dispozitivele</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Închide toate sesiunile, inclusiv pe cea de aici. Util dacă ai folosit contul pe un
          dispozitiv care nu e al tău.
        </p>
        <div className="mt-3">
          {signOutArmed ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">Vei fi deconectat și de aici.</span>
              <Button size="sm" variant="outline" onClick={() => setSignOutArmed(false)} disabled={signingOut}>
                Renunță
              </Button>
              <Button size="sm" onClick={signOutEverywhere} disabled={signingOut}>
                {signingOut ? "Se deconectează…" : "Deconectează tot"}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setSignOutArmed(true)}>
              <LogOut size={15} className="mr-1.5" /> Deconectează toate dispozitivele
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white border border-red-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-red-700">Șterge contul</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Ștergere definitivă: garajul, vehiculele, documentele și alertele dispar. Nu se poate
          anula.
        </p>

        {!deleteOpen ? (
          <button
            onClick={() => setDeleteOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
          >
            <Trash2 size={15} /> Vreau să-mi șterg contul
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            {ownedFleetNames.length > 0 && (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Se șterg și flotele pe care le deții, pentru toți membrii lor:{" "}
                <strong>{ownedFleetNames.join(", ")}</strong>.
              </p>
            )}
            <label className="block text-sm text-slate-700">
              Scrie <strong>{DELETE_CONFIRMATION_WORD}</strong> ca să confirmi
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                disabled={deleting}
                className="mt-1.5 block w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </label>
            {deleteError && (
              <p className="text-sm text-red-600" role="alert">
                {deleteError}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={deleting}
                onClick={() => {
                  setDeleteOpen(false);
                  setConfirmation("");
                  setDeleteError(null);
                }}
              >
                Renunță
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="flex-1"
                disabled={deleting || !isDeleteConfirmed(confirmation)}
                onClick={deleteAccount}
              >
                {deleting ? "Se șterge…" : "Șterge definitiv"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
