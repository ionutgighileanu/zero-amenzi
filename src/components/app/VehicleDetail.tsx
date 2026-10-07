"use client";

import { useState } from "react";
import { PenLine, Shield, Truck } from "lucide-react";
import { ChangePlateForm } from "@/components/app/ChangePlateForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { AddDocForm } from "@/components/app/AddDocForm";
import { DeleteConfirm } from "@/components/app/DeleteConfirm";
import { AddAlertButton, VehicleDocuments } from "@/components/app/VehicleDocuments";
import type { Vehicle, VehicleDoc } from "@/lib/vehicles";

type VehicleDetailProps = {
  vehicle: Vehicle;
  isB2B?: boolean;
  alertTypes: string[];
  onRca: (v: Vehicle) => void;
  onCasco: (v: Vehicle) => void;
  onAddDoc: (id: string, doc: Pick<VehicleDoc, "type" | "expires">) => void;
  onDeleteDoc: (id: string, docId: string) => void;
  onDelete: (id: string) => void;
  onChangePlate?: (
    v: Vehicle,
    plate: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onClose: () => void;
  /** Pornește cu formularul de alertă deschis — când omul a apăsat
   * „Adaugă" pe card, nu trebuie să-l mai caute o dată în modal. */
  startAdding?: boolean;
};

/**
 * Modalul de detalii. Lista de documente e aceeași componentă ca pe card
 * (VehicleDocuments), deci cele două arată identic; modalul adaugă doar
 * editarea: „Adaugă" și ștergerea alertelor suplimentare.
 */
export function VehicleDetail({
  vehicle,
  alertTypes,
  onRca,
  onCasco,
  onAddDoc,
  onDeleteDoc,
  onDelete,
  onChangePlate,
  onClose,
  startAdding = false,
}: VehicleDetailProps) {
  const [adding, setAdding] = useState(startAdding);
  const [changingPlate, setChangingPlate] = useState(false);
  const presets = [...new Set([...alertTypes, "Altul"])];

  const header = (
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <Plate plate={vehicle.plate} size="lg" />
        {vehicle.truck && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Truck size={14} aria-hidden /> Camion
          </span>
        )}
      </div>
      {vehicle.model && <p className="text-sm text-slate-600 mt-2">{vehicle.model}</p>}
      <p className="text-[11px] text-slate-500 font-mono tracking-wide mt-1.5">{vehicle.vin}</p>
    </div>
  );

  const addControl = adding ? null : <AddAlertButton onClick={() => setAdding(true)} />;

  return (
    <Modal onClose={onClose} title={`Detalii vehicul ${vehicle.plate}`} header={header} flush>
      <div className="px-5 pt-4 pb-4">
        <VehicleDocuments
          vehicle={vehicle}
          onRca={onRca}
          onDeleteExtra={(docId) => onDeleteDoc(vehicle.id, docId)}
          addControl={addControl}
        >
          {adding && (
            <div className="mt-2">
              <AddDocForm
                presets={presets}
                onAdd={(doc) => {
                  onAddDoc(vehicle.id, doc);
                  setAdding(false);
                }}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}
        </VehicleDocuments>
      </div>

      <div className="px-5 py-4 border-t border-slate-100">
        <Button className="w-full" onClick={() => onCasco(vehicle)}>
          <Shield size={16} className="mr-2" aria-hidden /> Ofertă CASCO
        </Button>
      </div>

      {onChangePlate && (
        <div className="px-5 pb-2">
          {changingPlate ? (
            <div className="border border-slate-200 rounded-xl">
              <ChangePlateForm
                currentPlate={vehicle.plate}
                strictRoPlate={false}
                onCancel={() => setChangingPlate(false)}
                onSubmit={async (plate) => {
                  const result = await onChangePlate(vehicle, plate);
                  if (result.ok) setChangingPlate(false);
                  return result;
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setChangingPlate(true)}
              className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <PenLine size={15} aria-hidden /> Schimbă numărul de înmatriculare
            </button>
          )}
        </div>
      )}

      <div className="px-5 pb-4">
        <DeleteConfirm
          label="Șterge vehiculul"
          onConfirm={() => {
            onDelete(vehicle.id);
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}
