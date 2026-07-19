"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import type { Vehicle } from "@/lib/vehicles";

type CascoModalProps = {
  vehicle: Vehicle;
  onClose: () => void;
};

export function CascoModal({ vehicle, onClose }: CascoModalProps) {
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <Modal
      onClose={onClose}
      title="Cere ofertă CASCO"
      subtitle="Trei întrebări. Brokerul partener revine cu oferte pe email."
    >
      <div className="mb-4">
        <Plate plate={vehicle.plate} size="sm" />
      </div>
      {sent ? (
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">Cerere trimisă</h4>
          <p className="text-sm text-slate-500 mb-6">
            Primești ofertele comparate pe email, de regulă în aceeași zi lucrătoare.
          </p>
          <Button size="sm" onClick={onClose} className="w-full">
            Am înțeles
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <Input
            label="Valoare estimată a mașinii (EUR)"
            type="number"
            placeholder="ex: 14 500"
            required
          />
          <Input
            label="Anul primei înmatriculări"
            type="number"
            placeholder="ex: 2021"
            required
          />
          <fieldset>
            <legend className="block text-sm font-medium text-slate-700 mb-1.5">
              Daune în ultimii 3 ani
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {["Nicio daună", "1 daună", "2+ daune"].map((opt, i) => (
                <label
                  key={opt}
                  className="flex items-center justify-center gap-1.5 border border-slate-300 rounded-lg py-2 text-xs font-medium text-slate-700 cursor-pointer has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50/50 has-[:checked]:text-blue-900"
                >
                  <input type="radio" name="daune" defaultChecked={i === 0} className="sr-only" />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="pt-2 flex gap-3">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
              Anulează
            </Button>
            <Button type="submit" size="sm" className="flex-1">
              Trimite cererea
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
