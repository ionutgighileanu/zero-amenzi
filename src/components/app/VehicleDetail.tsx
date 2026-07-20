"use client";

import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { DocLine } from "@/components/app/DocLine";
import { AddDocForm } from "@/components/app/AddDocForm";
import { DeleteConfirm } from "@/components/app/DeleteConfirm";
import { BRAND_BLUE } from "@/lib/constants";
import type { Vehicle, VehicleDoc } from "@/lib/vehicles";

type VehicleDetailProps = {
  vehicle: Vehicle;
  isB2B?: boolean;
  alertTypes: string[];
  onRca: (v: Vehicle) => void;
  onCasco: (v: Vehicle) => void;
  onAddDoc: (id: string, doc: VehicleDoc) => void;
  onDeleteDoc: (id: string, index: number) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function VehicleDetail({
  vehicle,
  isB2B,
  alertTypes,
  onRca,
  onCasco,
  onAddDoc,
  onDeleteDoc,
  onDelete,
  onClose,
}: VehicleDetailProps) {
  const [adding, setAdding] = useState(false);
  const extra = vehicle.docs ?? [];
  const presets = [...new Set([...alertTypes, "Altul"])];

  return (
    <Modal onClose={onClose} title="Detalii vehicul">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <Plate plate={vehicle.plate} size="lg" />
            {vehicle.truck && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Truck size={14} /> Camion
              </span>
            )}
          </div>
          {vehicle.model && <p className="text-sm text-slate-500 mt-2">{vehicle.model}</p>}
          <p className="text-xs text-slate-500 font-mono mt-1">{vehicle.vin}</p>
        </div>

        <section>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Documente obligatorii
          </h4>
          <DocLine
            label="RCA"
            date={vehicle.rca}
            action={
              <Button size="sm" variant="ghost" onClick={() => onRca(vehicle)}>
                Reînnoiește
              </Button>
            }
          />
          <DocLine label="ITP" date={vehicle.itp} />
          <DocLine label="Rovinietă" date={vehicle.rovinieta} />
          {isB2B && vehicle.truck && <DocLine label="Tahograf" date={vehicle.tahograf} />}
        </section>

        <section>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Alerte suplimentare
            </h4>
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="text-sm font-semibold inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
                style={{ color: BRAND_BLUE }}
              >
                <Plus size={14} /> Adaugă
              </button>
            )}
          </div>
          {extra.length === 0 && !adding && (
            <p className="text-sm text-slate-500 py-2">
              Extinctor, trusă medicală, revizie, CASCO, impozit auto… adaugă ce vrei să nu uiți.
            </p>
          )}
          {extra.map((d, i) => (
            <DocLine
              key={`${d.type}-${i}`}
              label={d.type}
              date={d.expires}
              onDelete={() => onDeleteDoc(vehicle.id, i)}
            />
          ))}
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
        </section>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onRca(vehicle)}>
            Reînnoiește RCA
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onCasco(vehicle)}>
            Ofertă CASCO
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <DeleteConfirm
            label="Șterge vehiculul"
            onConfirm={() => {
              onDelete(vehicle.id);
              onClose();
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
