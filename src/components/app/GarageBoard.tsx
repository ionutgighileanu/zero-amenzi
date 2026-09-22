"use client";

import { useState } from "react";
import { Plus, Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/app/VehicleCard";
import { AddVehicleModal } from "@/components/app/AddVehicleModal";
import { RcaModal } from "@/components/app/RcaModal";
import { CascoModal } from "@/components/app/CascoModal";
import { UndoBanner } from "@/components/app/UndoBanner";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { vehicleStatus, type Vehicle } from "@/lib/vehicles";
import {
  addVehicleAction,
  addVehicleDocAction,
  deleteVehicleDocAction,
  requestReverificationAction,
  softDeleteVehicleAction,
  undoDeleteVehicleAction,
} from "@/lib/actions/vehicles";
import { startUpgradeAction } from "@/lib/actions/payments";
import { errorMessage } from "@/lib/errorMessage";
import type { Space } from "@/lib/spaces";
import { canAddVehicle, vehicleAccess } from "@/lib/subscription";

type GarageBoardProps = {
  space: Space;
  initialVehicles: Vehicle[];
  /** Tipurile din care se alege când adaugi o alertă suplimentară pe un
   * vehicul. Citite din `alert_types`, cu DEFAULT_ALERT_TYPES pe post de
   * fallback — nu se mai editează din interfață. */
  alertTypes: string[];
  /** Vehiculele neplătite ale spațiului, inclusiv soft-deleted — baza
   * plafonului de trial (D-024). */
  unpaidVehicleCount: number;
};

export function GarageBoard({
  space,
  initialVehicles,
  alertTypes,
  unpaidVehicleCount,
}: GarageBoardProps) {

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

  const [addOpen, setAddOpen] = useState(false);
  // Ținut local ca să crească imediat după o adăugare reușită: altfel omul ar
  // putea deschide modalul din nou și completa formularul, doar ca să fie
  // respins de server.
  const [unpaidCount, setUnpaidCount] = useState(unpaidVehicleCount);
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

  const reverify = async (vehicle: Vehicle) => {
    setNotice(null);
    const result = await requestReverificationAction(vehicle.id, space.id);
    setNotice(result.ok ? result.message : result.error);
    if (result.ok) {
      setVehicles((list) =>
        list.map((v) => (v.id === vehicle.id ? { ...v, verificationPending: true } : v))
      );
    }
  };

  const addBlocked = canAddVehicle(space, unpaidCount);
  const problemCount = vehicles.filter((v) => vehicleStatus(v) !== "valid").length;
  const pendingCount = vehicles.filter((v) => v.verificationPending).length;

  const addVehicle = async (plate: string, vin: string) => {
    try {
      const { vehicle, verificationPending } = await addVehicleAction(space.id, plate, vin);
      setVehicles((list) => [
        {
          id: vehicle.id,
          plate: vehicle.plate,
          vin: vehicle.vin,
          model: vehicle.model,
          paidUntil: vehicle.paid_until,
          access: vehicleAccess(space, vehicle.paid_until),
          truck: vehicle.is_truck,
          itp: null,
          rca: null,
          rovinieta: null,
          tahograf: null,
          docs: [],
          verificationPending,
          deleted_at: null,
        },
        ...list,
      ]);
      setUnpaidCount((n) => n + 1);
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

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
            Mașinile mele
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {problemCount > 0
              ? `${problemCount} ${problemCount === 1 ? "vehicul cere" : "vehicule cer"} atenție. Restul e în regulă.`
              : pendingCount > 0
                ? `${pendingCount} ${pendingCount === 1 ? "vehicul în verificare" : "vehicule în verificare"}. Te anunțăm când actele sunt confirmate.`
                : "Toate documentele sunt în regulă."}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-1.5" /> Adaugă vehicul
        </Button>
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
              alertTypes={alertTypes}
              onRca={setRcaVehicle}
              onCasco={setCascoVehicle}
              onUpgrade={requestUpgrade}
              onAddDoc={addDoc}
              onDeleteDoc={deleteDoc}
              onDelete={softDelete}
              onReverify={reverify}
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

      {addOpen && (
        <AddVehicleModal
          onClose={() => setAddOpen(false)}
          onSubmit={addVehicle}
          strictRoPlate
          blockedReason={addBlocked.allowed ? null : addBlocked.reason}
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
