"use client";

import { useState } from "react";
import { Plus, Settings, Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/app/VehicleCard";
import { VehicleDetail } from "@/components/app/VehicleDetail";
import { AddVehicleModal } from "@/components/app/AddVehicleModal";
import { AlertTypesModal } from "@/components/app/AlertTypesModal";
import { RcaModal } from "@/components/app/RcaModal";
import { CascoModal } from "@/components/app/CascoModal";
import { UndoBanner } from "@/components/app/UndoBanner";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { vehicleStatus, type Vehicle } from "@/lib/vehicles";
import {
  addVehicleAction,
  addVehicleDocAction,
  deleteVehicleDocAction,
  softDeleteVehicleAction,
  undoDeleteVehicleAction,
} from "@/lib/actions/vehicles";
import { saveAlertTypesAction } from "@/lib/actions/alertTypes";
import { startUpgradeAction } from "@/lib/actions/payments";
import { errorMessage } from "@/lib/errorMessage";
import type { Space } from "@/lib/spaces";
import { vehicleAccess } from "@/lib/subscription";

type GarageBoardProps = {
  space: Space;
  initialVehicles: Vehicle[];
  initialAlertTypes: string[];
};

export function GarageBoard({ space, initialVehicles, initialAlertTypes }: GarageBoardProps) {

  const {
    visible: vehicles,
    setItems: setVehicles,
    pendingItem,
    softDelete,
    undo,
  } = useSoftDelete<Vehicle>(initialVehicles, {
    onDelete: (id) => softDeleteVehicleAction(id, space.id),
    onUndo: (id) => undoDeleteVehicleAction(id, space.id),
  });

  const [alertTypes, setAlertTypes] = useState<string[]>(initialAlertTypes);
  const [addOpen, setAddOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [rcaVehicle, setRcaVehicle] = useState<Vehicle | null>(null);
  const [cascoVehicle, setCascoVehicle] = useState<Vehicle | null>(null);
  // Un singur canal pentru tot ce trebuie spus utilizatorului: erori de la
  // acțiuni și răspunsul fluxului de plată. Înainte fiecare catch făcea doar
  // console.error, deci un eșec arăta exact ca „nu s-a întâmplat nimic".
  const [notice, setNotice] = useState<string | null>(null);

  const requestUpgrade = async (vehicle: Vehicle) => {
    setNotice(null);
    const result = await startUpgradeAction(space.id, [vehicle.id]);
    if (result.status === "redirect") {
      window.location.href = result.url;
      return;
    }
    setNotice(result.message);
  };
  const [detailId, setDetailId] = useState<string | null>(null);

  const problemCount = vehicles.filter((v) => vehicleStatus(v) !== "valid").length;
  const detailVehicle = detailId ? vehicles.find((v) => v.id === detailId) : null;

  const addVehicle = async (plate: string, vin: string) => {
    try {
      const { vehicle, docs } = await addVehicleAction(space.id, plate, vin);
      const findDoc = (type: string) => docs.find((d) => d.type === type)?.expires_at ?? null;
      setVehicles((list) => [
        {
          id: vehicle.id,
          plate: vehicle.plate,
          vin: vehicle.vin,
          model: vehicle.model,
          paidUntil: vehicle.paid_until,
          access: vehicleAccess(space, vehicle.paid_until),
          truck: vehicle.is_truck,
          itp: findDoc("ITP"),
          rca: findDoc("RCA"),
          rovinieta: findDoc("Rovinietă"),
          tahograf: null,
          docs: [],
          deleted_at: null,
        },
        ...list,
      ]);
    } catch (err) {
      console.error(err);
      setNotice(errorMessage(err));
    }
  };

  const addDoc = async (id: string, doc: { type: string; expires: string }) => {
    try {
      const row = await addVehicleDocAction(id, doc.type, doc.expires, space.id);
      setVehicles((list) =>
        list.map((v) =>
          v.id === id
            ? {
                ...v,
                docs: [...(v.docs ?? []), { id: row.id, type: row.type, expires: row.expires_at }],
              }
            : v
        )
      );
    } catch (err) {
      console.error(err);
      setNotice(errorMessage(err));
    }
  };

  const deleteDoc = async (id: string, docId: string) => {
    try {
      await deleteVehicleDocAction(docId, space.id);
      setVehicles((list) =>
        list.map((v) =>
          v.id === id ? { ...v, docs: (v.docs ?? []).filter((d) => d.id !== docId) } : v
        )
      );
    } catch (err) {
      console.error(err);
      setNotice(errorMessage(err));
    }
  };

  const saveAlertTypes = (types: string[]) => {
    setAlertTypes(types);
    void saveAlertTypesAction(space.id, types);
  };

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

      {notice && (
        <div
          className="mb-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900"
          role="status"
        >
          <Info size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span className="flex-1">{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="shrink-0 font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 rounded"
          >
            Închide
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence initial={false}>
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onOpen={(veh) => setDetailId(veh.id)}
              onRca={setRcaVehicle}
              onCasco={setCascoVehicle}
              onUpgrade={requestUpgrade}
            />
          ))}
        </AnimatePresence>

        {/* Empty-slot: invitație la acțiune, nu decor */}
        <motion.button
          layout
          onClick={() => setAddOpen(true)}
          className="min-h-70 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex flex-col items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          <Plus size={22} />
          <span className="text-sm font-medium">Adaugă o mașină</span>
          <span className="text-xs">Număr + serie șasiu. Atât.</span>
        </motion.button>
      </div>

      {addOpen && <AddVehicleModal onClose={() => setAddOpen(false)} onSubmit={addVehicle} />}
      {alertsOpen && (
        <AlertTypesModal
          selected={alertTypes}
          onSave={saveAlertTypes}
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
