"use client";

import { FormEvent, useState } from "react";
import { isValidRoPlateInput, sanitizePlateInput } from "@/lib/plate";
import { PLATE_CHANGES_PER_YEAR } from "@/lib/subscription";
import {
  PLATE_INPUT_MAX_LENGTH,
  PLATE_INVALID_MESSAGE,
  RO_PLATE_INPUT_MAX_LENGTH,
} from "@/lib/constants";

type ChangePlateFormProps = {
  currentPlate: string;
  strictRoPlate: boolean;
  /** Întoarce rezultatul acțiunii; eroarea rămâne în formular, ca omul să
   * poată corecta fără să-l redeschidă. */
  onSubmit: (plate: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
};

/** Schimbarea numărului de înmatriculare (D-033): aceeași mașină, alt număr. */
export function ChangePlateForm({
  currentPlate,
  strictRoPlate,
  onSubmit,
  onCancel,
}: ChangePlateFormProps) {
  const [plate, setPlate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const valid = strictRoPlate ? isValidRoPlateInput(plate) : plate.trim().length > 0;
  const showFormatError = strictRoPlate && plate.length > 0 && !valid;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || pending) return;
    setPending(true);
    setError(null);
    const result = await onSubmit(plate.trim());
    setPending(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <form onSubmit={submit} className="p-2 space-y-2.5">
      <label className="block">
        <span className="block text-sm font-medium text-slate-700">
          Numărul nou pentru {currentPlate}
        </span>
        <input
          value={plate}
          onChange={(e) => setPlate(sanitizePlateInput(e.target.value, strictRoPlate))}
          maxLength={strictRoPlate ? RO_PLATE_INPUT_MAX_LENGTH : PLATE_INPUT_MAX_LENGTH}
          placeholder="B 100 ABC"
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={showFormatError || !!error}
          className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        />
      </label>
      <p className="text-xs text-slate-500">
        Pentru reînmatriculare sau număr personalizat. Mașina își păstrează abonamentul. Maximum{" "}
        {PLATE_CHANGES_PER_YEAR} schimbări pe an.
      </p>
      {(showFormatError || error) && (
        <p className="text-sm text-red-600" role="alert">
          {error ?? PLATE_INVALID_MESSAGE}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          Anulează
        </button>
        <button
          type="submit"
          disabled={!valid || pending}
          className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:opacity-90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          {pending ? "Se salvează…" : "Schimbă"}
        </button>
      </div>
    </form>
  );
}
