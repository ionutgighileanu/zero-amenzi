"use client";

import { FormEvent, useState } from "react";
import { Lock, Zap } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VEHICLE_PRICE_RON_PER_YEAR } from "@/lib/subscription";
import { isValidRoPlateInput, sanitizePlateInput } from "@/lib/plate";
import {
  PLATE_INPUT_MAX_LENGTH,
  PLATE_INVALID_MESSAGE,
  RO_PLATE_INPUT_MAX_LENGTH,
} from "@/lib/constants";

type AddVehicleModalProps = {
  onClose: () => void;
  onSubmit: (plate: string, vin: string) => void;
  /**
   * Garaj personal: plăcuță RO strictă, validată live, plafon 10.
   * Flotă (implicit): permisiv — camioanele B2B pot fi înmatriculate în afara
   * României, deci doar majuscule + plafon 32, fără verificare de format.
   */
  strictRoPlate?: boolean;
  /** Motivul pentru care spațiul nu mai poate primi vehicule (D-024). Când e
   * setat, modalul arată upsell-ul în loc de formular — nu are rost să lași
   * omul să completeze ca să afle la submit că e blocat. */
  blockedReason?: string | null;
};

export function AddVehicleModal({
  onClose,
  onSubmit,
  strictRoPlate = false,
  blockedReason,
}: AddVehicleModalProps) {
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");

  const plateValid = strictRoPlate ? isValidRoPlateInput(plate) : plate.trim().length > 0;
  const showPlateError = strictRoPlate && plate.length > 0 && !plateValid;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!plateValid) return;
    onSubmit(plate.trim(), vin.trim().toUpperCase());
    onClose();
  };

  if (blockedReason) {
    return (
      <Modal onClose={onClose} title="Ai nevoie de Premium">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Lock size={18} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-slate-700">{blockedReason}</p>
          </div>
          <p className="text-sm text-slate-600">
            Premium costă <strong>{VEHICLE_PRICE_RON_PER_YEAR} lei pe an per vehicul</strong> și
            include verificarea actelor, alertele pe email și notificările push.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
              Închide
            </Button>
            <Button size="sm" className="flex-1" disabled title="Plata online vine în curând">
              Trece la Premium
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Plata online vine în curând. Până atunci, scrie-ne și îți activăm Premium manual.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      title="Adaugă un vehicul"
      subtitle="Doar două câmpuri. Restul datelor le preluăm noi."
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <Input
            label="Număr de înmatriculare"
            placeholder="B 100 ABC"
            required
            autoFocus
            value={plate}
            onChange={(e) => setPlate(sanitizePlateInput(e.target.value, strictRoPlate))}
            maxLength={strictRoPlate ? RO_PLATE_INPUT_MAX_LENGTH : PLATE_INPUT_MAX_LENGTH}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={showPlateError}
            aria-describedby={showPlateError ? "plate-eroare" : undefined}
          />
          {showPlateError && (
            <p id="plate-eroare" className="text-sm text-red-600 mt-1.5" role="alert">
              {PLATE_INVALID_MESSAGE}
            </p>
          )}
        </div>
        <Input
          label="Serie șasiu (VIN)"
          placeholder="17 caractere"
          hint="O găsești în talon, rubrica E."
          required
          minLength={17}
          maxLength={17}
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <Zap size={16} className="text-blue-700 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Verificăm ITP, RCA și rovinieta în bazele oficiale și îți setăm
            alertele. Nu introduci nicio dată manual.
          </p>
        </div>
        <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            Anulează
          </Button>
          <Button type="submit" size="sm" className="flex-1" disabled={!plateValid}>
            Verifică și adaugă
          </Button>
        </div>
      </form>
    </Modal>
  );
}
