"use client";

import { MouseEvent } from "react";
import { ChevronRight, Lock, Mail, MessageSquare, Zap } from "lucide-react";
import { motion } from "motion/react";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { VehicleDocuments } from "@/components/app/VehicleDocuments";
import { getStatus } from "@/lib/status";
import { vehicleStatus, type Vehicle } from "@/lib/vehicles";
import { VEHICLE_PRICE_RON_PER_YEAR } from "@/lib/subscription";

type VehicleCardProps = {
  vehicle: Vehicle;
  onOpen: (v: Vehicle) => void;
  onRca: (v: Vehicle) => void;
  onCasco: (v: Vehicle) => void;
  onUpgrade: (v: Vehicle) => void;
};

export function VehicleCard({ vehicle: v, onOpen, onRca, onCasco, onUpgrade }: VehicleCardProps) {
  const vStatus = vehicleStatus(v);
  const rcaStatus = getStatus(v.rca);

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
      onClick={() => onOpen(v)}
      className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${vStatus === "expired" ? "border-red-300" : vStatus === "warning" ? "border-amber-300" : "border-slate-200"}`}
    >
      <div className="p-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <Plate plate={v.plate} size="md" />
          {v.model && (
            <p className="text-xs font-medium text-slate-600 mt-2">{v.model}</p>
          )}
          <p className="text-[11px] text-slate-500 font-mono mt-0.5 tracking-wide">{v.vin}</p>
        </div>
        {vStatus === "expired" && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-1 shrink-0">
            Acțiune necesară
          </span>
        )}
        {vStatus === "warning" && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-1 shrink-0">
            Expiră curând
          </span>
        )}
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
          <VehicleDocuments vehicle={v} onRca={onRca} />
        )}
      </div>

      <div className="px-5 pt-1">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
          Detalii, editare, ștergere <ChevronRight size={13} />
        </span>
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
        <div className="px-5 py-3 border-t border-blue-100 bg-blue-50/60 flex items-center gap-2 text-xs font-medium text-brand">
          <Zap size={13} aria-hidden="true" /> Premium · sincronizare lunară automată
          <span className="ml-auto flex items-center gap-1 text-blue-700/70">
            <MessageSquare size={12} aria-hidden="true" /> SMS
          </span>
        </div>
      ) : v.access === "locked" ? (
        <div className="px-5 py-3 border-t border-red-100 bg-red-50 flex flex-wrap items-center gap-2 text-xs text-red-700">
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
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2 text-xs text-slate-500">
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
