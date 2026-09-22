"use client";

import { MouseEvent, ReactNode, useState } from "react";
import { ArrowRight, Bell, ChevronDown, Plus, Shield, Truck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { DocLine } from "@/components/app/DocLine";
import { StatusCell } from "@/components/app/StatusCell";
import { AddDocForm } from "@/components/app/AddDocForm";
import { DeleteConfirm } from "@/components/app/DeleteConfirm";
import { getStatus } from "@/lib/status";
import { CORE_DOC_TYPES, type Vehicle, type VehicleDoc } from "@/lib/vehicles";

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

const LINK = "inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded";

/** Link-urile de cumpărare încă fără destinație: nu sar în capul paginii. */
const placeholderClick = (e: MouseEvent) => e.preventDefault();

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
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const extra = vehicle.docs ?? [];
  const presets = [...new Set([...alertTypes, "Altul"])];
  // Rândul restrâns ascunde datele — un punct colorat pe clopoțel semnalează
  // o alertă suplimentară care expiră curând sau a expirat deja.
  const extraAttention = extra.some((d) => getStatus(d.expires) !== "valid");

  // Acțiunea apare doar când documentul cere ceva: un act în regulă, sau
  // unul încă în verificare, nu are ce cumpăra.
  const needsAction = (date: string | null | undefined) => {
    const status = getStatus(date);
    return status === "expired" || status === "warning";
  };

  const rows: { label: string; date: string | null | undefined; action: ReactNode }[] = [
    {
      label: "RCA",
      date: vehicle.rca,
      // Deschide ofertele RCA — fluxul de comision de broker, nu un link gol.
      action: (
        <button onClick={() => onRca(vehicle)} className={LINK}>
          Cumpără <ArrowRight size={12} aria-hidden />
        </button>
      ),
    },
    {
      label: "ITP",
      date: vehicle.itp,
      // ITP-ul nu se cumpără online, se face la o stație autorizată RAR.
      action: <span className="text-xs text-slate-500">Stație RAR</span>,
    },
    {
      label: CORE_DOC_TYPES.rovinieta,
      date: vehicle.rovinieta,
      action: (
        <a href="#" onClick={placeholderClick} className={LINK}>
          Cumpără <ArrowRight size={12} aria-hidden />
        </a>
      ),
    },
  ];

  if (isB2B && vehicle.truck) {
    rows.push({ label: CORE_DOC_TYPES.tahograf, date: vehicle.tahograf, action: null });
  }

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

  return (
    <Modal onClose={onClose} title={`Detalii vehicul ${vehicle.plate}`} header={header} flush>
      <section className="px-5 pt-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Documente obligatorii
        </h4>
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li
              key={row.label}
              className="grid grid-cols-[1fr_auto_5.5rem] items-center gap-2 py-3"
            >
              <span className="text-sm font-semibold text-slate-800">{row.label}</span>
              <StatusCell date={row.date} pending={vehicle.verificationPending} />
              <span className="text-right">{needsAction(row.date) ? row.action : null}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 pt-3 pb-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Alerte suplimentare
        </h4>
        <div className="flex items-center gap-3 py-2">
          {extra.length > 0 ? (
            <button
              onClick={() => setAlertsOpen((open) => !open)}
              aria-expanded={alertsOpen}
              className="flex items-center gap-2 flex-1 min-w-0 text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <span className="relative shrink-0">
                <Bell size={16} className="text-slate-400" aria-hidden />
                {extraAttention && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </span>
              <span className="text-sm text-slate-700 truncate">
                {extra.map((d) => d.type).join(", ")}
              </span>
              <ChevronDown
                size={14}
                className={`shrink-0 text-slate-400 transition-transform ${alertsOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
          ) : (
            <span className="flex items-center gap-2 flex-1 min-w-0">
              <Bell size={16} className="text-slate-400 shrink-0" aria-hidden />
              <span className="text-sm text-slate-500 truncate">
                Extinctor, trusă medicală, revizie…
              </span>
            </span>
          )}
          {!adding && (
            <button
              onClick={() => {
                setAdding(true);
                setAlertsOpen(true);
              }}
              className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-brand rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <Plus size={14} aria-hidden /> Adaugă
            </button>
          )}
        </div>

        {alertsOpen && (
          <div className="mt-1">
            {extra.map((d) => (
              <DocLine
                key={d.id}
                label={d.type}
                date={d.expires}
                onDelete={() => onDeleteDoc(vehicle.id, d.id)}
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
          </div>
        )}
      </section>

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
