"use client";

import { FormEvent, useState } from "react";
import { Zap } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type AddVehicleModalProps = {
  onClose: () => void;
  onSubmit: (plate: string, vin: string) => void;
};

export function AddVehicleModal({ onClose, onSubmit }: AddVehicleModalProps) {
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(plate.trim().toUpperCase(), vin.trim().toUpperCase());
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Adaugă un vehicul"
      subtitle="Doar două câmpuri. Restul datelor le preluăm noi."
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="Număr de înmatriculare"
          placeholder="B 100 ABC"
          required
          autoFocus
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          style={{ textTransform: "uppercase" }}
        />
        <Input
          label="Serie șasiu (VIN)"
          placeholder="17 caractere"
          hint="O găsești în talon, rubrica E."
          required
          minLength={17}
          maxLength={17}
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          style={{ textTransform: "uppercase" }}
        />
        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <Zap size={16} className="text-blue-700 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Verificăm automat ITP, RCA și rovinieta în bazele oficiale și îți
            setăm alertele. Nu introduci nicio dată manual.
          </p>
        </div>
        <div className="pt-2 flex gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            Anulează
          </Button>
          <Button type="submit" size="sm" className="flex-1">
            Verifică și adaugă
          </Button>
        </div>
      </form>
    </Modal>
  );
}
