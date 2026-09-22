"use client";

import { MouseEvent, ReactNode } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { StatusCell } from "@/components/app/StatusCell";
import { getStatus } from "@/lib/status";
import { CORE_DOC_TYPES, type Vehicle } from "@/lib/vehicles";

type VehicleDocumentsProps = {
  vehicle: Vehicle;
  onRca: (v: Vehicle) => void;
  /** Doar în modal: ștergerea unei alerte suplimentare. Pe card lipsește —
   * acolo lista e doar de citit, iar click-ul deschide modalul. */
  onDeleteExtra?: (docId: string) => void;
  /** Butonul „Adaugă" din dreptul titlului de secțiune (AddAlertButton). */
  addControl?: ReactNode;
  /** Doar în modal: formularul de adăugare, sub lista de alerte. */
  children?: ReactNode;
};

const SECTION = "text-[11px] font-bold uppercase tracking-wider text-slate-500";
const LINK =
  "inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded";

/** Cardul întreg e clickabil (deschide modalul): acțiunile din rânduri nu
 * trebuie să declanșeze și deschiderea. */
const stop = (e: MouseEvent) => e.stopPropagation();

/** Butonul „Adaugă" al alertelor suplimentare — același pe card și în modal. */
export function AddAlertButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        stop(e);
        onClick();
      }}
      className="inline-flex items-center gap-1 text-sm font-semibold text-brand rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
    >
      <Plus size={14} aria-hidden /> Adaugă
    </button>
  );
}

function Row({
  label,
  date,
  pending,
  action,
  onDelete,
}: {
  label: string;
  date: string | null | undefined;
  pending?: boolean;
  action?: ReactNode;
  onDelete?: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0 pt-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {action && <div className="mt-0.5">{action}</div>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <StatusCell date={date} pending={pending} />
        {onDelete && (
          <button
            onClick={(e) => {
              stop(e);
              onDelete();
            }}
            aria-label={`Șterge ${label}`}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Lista de documente a unui vehicul — ACEEAȘI în cardul din garaj, în cardul
 * de flotă și în modalul de detalii. Orice schimbare de aici apare în toate
 * trei, deci nu se mai pot contrazice.
 */
export function VehicleDocuments({
  vehicle,
  onRca,
  onDeleteExtra,
  addControl,
  children,
}: VehicleDocumentsProps) {
  const extra = vehicle.docs ?? [];
  const pending = vehicle.verificationPending;

  // Acțiunea apare doar când actul cere ceva: unul în regulă, sau încă în
  // verificare, n-are ce cumpăra.
  const needsAction = (date: string | null | undefined) => {
    const status = getStatus(date);
    return status === "expired" || status === "warning";
  };

  const core: { label: string; date: string | null | undefined; action?: ReactNode }[] = [
    {
      label: "RCA",
      date: vehicle.rca,
      // Deschide ofertele RCA — fluxul de comision de broker.
      action: (
        <button
          onClick={(e) => {
            stop(e);
            onRca(vehicle);
          }}
          className={LINK}
        >
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
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            stop(e);
          }}
          className={LINK}
        >
          Cumpără <ArrowRight size={12} aria-hidden />
        </a>
      ),
    },
  ];
  // Camioanele (doar în flote) au și tahograf.
  if (vehicle.truck) {
    core.push({ label: CORE_DOC_TYPES.tahograf, date: vehicle.tahograf });
  }

  const showExtraSection = extra.length > 0 || addControl !== undefined;

  return (
    <div>
      <h4 className={`${SECTION} mb-0.5`}>Documente obligatorii</h4>
      <ul className="divide-y divide-slate-100">
        {core.map((row) => (
          <Row
            key={row.label}
            label={row.label}
            date={row.date}
            pending={pending}
            action={needsAction(row.date) ? row.action : undefined}
          />
        ))}
      </ul>
      {pending && (
        <p className="text-xs text-slate-500 pt-1 pb-2">
          Verificăm actele în bazele oficiale. Te anunțăm când sunt confirmate.
        </p>
      )}

      {showExtraSection && (
        <>
          <div className="flex items-center justify-between mt-3 mb-0.5">
            <h4 className={SECTION}>Alerte suplimentare</h4>
            {addControl}
          </div>
          {extra.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {extra.map((d) => (
                <Row
                  key={d.id}
                  label={d.type}
                  date={d.expires}
                  onDelete={onDeleteExtra ? () => onDeleteExtra(d.id) : undefined}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 py-2">
              Extinctor, trusă medicală, revizie, impozit auto… adaugă ce vrei să nu uiți.
            </p>
          )}
          {children}
        </>
      )}
    </div>
  );
}
