"use client";

import { MouseEvent } from "react";
import { ChevronRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { VehicleDocuments } from "@/components/app/VehicleDocuments";
import { getStatus } from "@/lib/status";
import { vehicleStatus, type Vehicle } from "@/lib/vehicles";

type FleetVehicleCardProps = {
  vehicle: Vehicle;
  onOpen: (v: Vehicle) => void;
  onRca: (v: Vehicle) => void;
};

/** Card stivuit pentru tabelul de flotă sub 768px (decizie D-009). */
export function FleetVehicleCard({ vehicle: v, onOpen, onRca }: FleetVehicleCardProps) {
  const vStatus = vehicleStatus(v);
  const rcaStatus = getStatus(v.rca);

  const stop = (e: MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      onClick={() => onOpen(v)}
      className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow ${vStatus === "expired" ? "border-red-300" : vStatus === "warning" ? "border-amber-300" : "border-slate-200"}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Plate plate={v.plate} size="sm" />
          {v.truck && <Truck size={14} className="text-slate-400" aria-label="Camion" />}
        </div>
        <ChevronRight size={16} className="text-slate-300 shrink-0 mt-1.5" />
      </div>

      <VehicleDocuments vehicle={v} onRca={onRca} />

      {rcaStatus !== "valid" && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <Button
            size="sm"
            variant={rcaStatus === "expired" ? "danger" : "primary"}
            className="w-full"
            onClick={(e) => stop(e, () => onRca(v))}
          >
            Reînnoiește RCA
          </Button>
        </div>
      )}
    </div>
  );
}
