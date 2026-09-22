"use client";

import { useState } from "react";
import { Plus, Shield, Truck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { AddDocForm } from "@/components/app/AddDocForm";
import { DeleteConfirm } from "@/components/app/DeleteConfirm";
import { VehicleDocuments } from "@/components/app/VehicleDocuments";
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
  onClose: () => void;
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
  onClose,
}: VehicleDetailProps) {
  const [adding, setAdding] = useState(false);
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

  const addControl = adding ? null : (
    <button
      onClick={() => setAdding(true)}
      className="inline-flex items-center gap-1 text-sm font-semibold text-brand rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
    >
      <Plus size={14} aria-hidden /> Adaugă
    </button>
  );

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
