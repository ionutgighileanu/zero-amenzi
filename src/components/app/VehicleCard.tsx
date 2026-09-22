"use client";

import { MouseEvent, useState } from "react";
import { Lock, Mail, MessageSquare, Zap } from "lucide-react";
import { motion } from "motion/react";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { AddDocForm } from "@/components/app/AddDocForm";
import { AddAlertButton, VehicleDocuments } from "@/components/app/VehicleDocuments";
import { VehicleMenu } from "@/components/app/VehicleMenu";
import { getStatus } from "@/lib/status";
import { vehicleStatus, type Vehicle, type VehicleDoc } from "@/lib/vehicles";
import { VEHICLE_PRICE_RON_PER_YEAR } from "@/lib/subscription";

type VehicleCardProps = {
  vehicle: Vehicle;
  /** Tipurile propuse în formularul de alertă suplimentară. */
  alertTypes: string[];
  onRca: (v: Vehicle) => void;
  onCasco: (v: Vehicle) => void;
  onUpgrade: (v: Vehicle) => void;
  onAddDoc: (id: string, doc: Pick<VehicleDoc, "type" | "expires">) => void;
  onDeleteDoc: (id: string, docId: string) => void;
  onDelete: (id: string) => void;
  onReverify: (v: Vehicle) => void;
};

/**
 * Cardul vehiculului din garaj. Arată și editează totul pe loc — documente,
 * alerte suplimentare (adăugare și ștergere) —, iar ce nu are loc pe card stă
 * în meniul ⚙. Fereastra de detalii separată a dispărut: repeta exact
 * conținutul cardului.
 */
export function VehicleCard({
  vehicle: v,
  alertTypes,
  onRca,
  onCasco,
  onUpgrade,
  onAddDoc,
  onDeleteDoc,
  onDelete,
  onReverify,
}: VehicleCardProps) {
  const [adding, setAdding] = useState(false);
  const vStatus = vehicleStatus(v);
  const rcaStatus = getStatus(v.rca);
  const presets = [...new Set([...alertTypes, "Altul"])];

  const stop = (e: MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: DURATION.enter, ease: EASE_OUT }}
      // Chenarul colorat e semnalul de stare al vehiculului — eticheta
      // „Acțiune necesară" / „Expiră curând" repeta același lucru.
      className={`bg-white rounded-2xl border shadow-sm flex flex-col ${vStatus === "expired" ? "border-red-300" : vStatus === "warning" ? "border-amber-300" : "border-slate-200"}`}
    >
      <div className="p-5 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Plate plate={v.plate} size="md" />
          {v.model && <p className="text-xs font-medium text-slate-600 mt-2">{v.model}</p>}
          <p className="text-[11px] text-slate-500 font-mono mt-0.5 tracking-wide">{v.vin}</p>
        </div>
        <VehicleMenu
          plate={v.plate}
          paid={v.access === "paid"}
          onReverify={() => onReverify(v)}
          onUpgrade={() => onUpgrade(v)}
          onDelete={() => onDelete(v.id)}
        />
      </div>

      <div className="px-5 flex-1">
        {v.access === "locked" ? (
          /* Abonament expirat pe ACEST vehicul: datele nu se mai arată. Nu e
             doar un badge — conținutul pentru care se plătește dispare, iar
             în loc rămâne calea de reînnoire. */
          <div className="py-6 text-center">
            <Lock size={20} className="mx-auto text-slate-300 mb-2" aria-hidden="true" />
            <p className="text-sm text-slate-600">
              Datele RCA, ITP și rovinietă sunt ascunse pentru acest vehicul.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Reînnoiește abonamentul ca să le vezi din nou.
            </p>
          </div>
        ) : (
          <VehicleDocuments
            vehicle={v}
            onRca={onRca}
            onDeleteExtra={(docId) => onDeleteDoc(v.id, docId)}
            addControl={adding ? null : <AddAlertButton onClick={() => setAdding(true)} />}
          >
            {adding && (
              <div className="mt-2">
                <AddDocForm
                  presets={presets}
                  onAdd={(doc) => {
                    onAddDoc(v.id, doc);
                    setAdding(false);
                  }}
                  onCancel={() => setAdding(false)}
                />
              </div>
            )}
          </VehicleDocuments>
        )}
      </div>

      <div className="p-5 pt-3 flex gap-2">
        <Button
          variant={rcaStatus === "expired" ? "danger" : rcaStatus === "warning" ? "primary" : "outline"}
          size="sm"
          className="flex-1"
          onClick={(e) => stop(e, () => onRca(v))}
        >
          Reînnoiește RCA
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => stop(e, () => onCasco(v))}>
          CASCO
        </Button>
      </div>

      {/* Starea de abonament, pe trei niveluri. Ascunderea efectivă a datelor
          se face mai sus, în secțiunea de documente. */}
      {v.access === "paid" ? (
        <div className="px-5 py-3 border-t border-blue-100 bg-blue-50/60 rounded-b-2xl flex items-center gap-2 text-xs font-medium text-brand">
          <Zap size={13} aria-hidden="true" /> Premium · sincronizare lunară automată
          <span className="ml-auto flex items-center gap-1 text-blue-700/70">
            <MessageSquare size={12} aria-hidden="true" /> SMS
          </span>
        </div>
      ) : v.access === "locked" ? (
        <div className="px-5 py-3 border-t border-red-100 bg-red-50 rounded-b-2xl flex flex-wrap items-center gap-2 text-xs text-red-700">
          <Lock size={13} aria-hidden="true" />
          <span>Abonamentul a expirat</span>
          <button
            onClick={(e) => stop(e, () => onUpgrade(v))}
            className="ml-auto font-semibold text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 rounded"
          >
            Reînnoiește · {VEHICLE_PRICE_RON_PER_YEAR} lei/an
          </button>
        </div>
      ) : (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center gap-2 text-xs text-slate-500">
          <Mail size={13} aria-hidden="true" /> Gratuit în perioada de probă
          <button
            onClick={(e) => stop(e, () => onUpgrade(v))}
            className="ml-auto font-semibold text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
          >
            Premium · {VEHICLE_PRICE_RON_PER_YEAR} lei/an
          </button>
        </div>
      )}
    </motion.div>
  );
}
