"use client";

import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/app/VehicleCard";
import { VehicleDetail } from "@/components/app/VehicleDetail";
import { AddVehicleModal } from "@/components/app/AddVehicleModal";
import { AlertTypesModal } from "@/components/app/AlertTypesModal";
import { RcaModal } from "@/components/app/RcaModal";
import { CascoModal } from "@/components/app/CascoModal";
import { UndoBanner } from "@/components/app/UndoBanner";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { DEFAULT_ALERT_TYPES } from "@/lib/constants";
import {
  MOCK_VEHICLES_B2C,
  createVehicle,
  vehicleStatus,
  type Vehicle,
  type VehicleDoc,
} from "@/lib/vehicles";

export default function GaragePage() {
  const {
    visible: vehicles,
    setItems: setVehicles,
    pendingItem,
    softDelete,
    undo,
  } = useSoftDelete<Vehicle>(MOCK_VEHICLES_B2C);

  const [alertTypes, setAlertTypes] = useState<string[]>(DEFAULT_ALERT_TYPES);
  const [addOpen, setAddOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [rcaVehicle, setRcaVehicle] = useState<Vehicle | null>(null);
  const [cascoVehicle, setCascoVehicle] = useState<Vehicle | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const problemCount = vehicles.filter((v) => vehicleStatus(v) !== "valid").length;
  const detailVehicle = detailId ? vehicles.find((v) => v.id === detailId) : null;

  const addVehicle = (plate: string, vin: string) =>
    setVehicles((list) => [createVehicle(plate, vin), ...list]);

  const addDoc = (id: string, doc: VehicleDoc) =>
    setVehicles((list) =>
      list.map((v) => (v.id === id ? { ...v, docs: [...(v.docs ?? []), doc] } : v))
    );

  const deleteDoc = (id: string, idx: number) =>
    setVehicles((list) =>
      list.map((v) =>
        v.id === id ? { ...v, docs: (v.docs ?? []).filter((_, i) => i !== idx) } : v
      )
    );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
            Mașinile mele
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {problemCount === 0
              ? "Toate documentele sunt în regulă."
              : `${problemCount} ${problemCount === 1 ? "vehicul cere" : "vehicule cer"} atenție. Restul e în regulă.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAlertsOpen(true)}>
            <Settings size={16} className="mr-1.5" /> Tipuri alerte
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={16} className="mr-1.5" /> Adaugă vehicul
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            onOpen={(veh) => setDetailId(veh.id)}
            onRca={setRcaVehicle}
            onCasco={setCascoVehicle}
          />
        ))}

        {/* Empty-slot: invitație la acțiune, nu decor */}
        <button
          onClick={() => setAddOpen(true)}
          className="min-h-70 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors flex flex-col items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          <Plus size={22} />
          <span className="text-sm font-medium">Adaugă o mașină</span>
          <span className="text-xs">Număr + serie șasiu. Atât.</span>
        </button>
      </div>

      {addOpen && <AddVehicleModal onClose={() => setAddOpen(false)} onSubmit={addVehicle} />}
      {alertsOpen && (
        <AlertTypesModal
          selected={alertTypes}
          onSave={setAlertTypes}
          onClose={() => setAlertsOpen(false)}
        />
      )}
      {detailVehicle && (
        <VehicleDetail
          vehicle={detailVehicle}
          alertTypes={alertTypes}
          onRca={setRcaVehicle}
          onCasco={setCascoVehicle}
          onAddDoc={addDoc}
          onDeleteDoc={deleteDoc}
          onDelete={softDelete}
          onClose={() => setDetailId(null)}
        />
      )}
      {rcaVehicle && <RcaModal vehicle={rcaVehicle} onClose={() => setRcaVehicle(null)} />}
      {cascoVehicle && <CascoModal vehicle={cascoVehicle} onClose={() => setCascoVehicle(null)} />}
      {pendingItem && (
        <UndoBanner
          message={`Vehicul șters: ${pendingItem.plate}.`}
          onUndo={() => undo(pendingItem.id)}
        />
      )}
    </main>
  );
}
