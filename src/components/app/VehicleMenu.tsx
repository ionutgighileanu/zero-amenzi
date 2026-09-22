"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Settings, Trash2, Zap } from "lucide-react";

type VehicleMenuProps = {
  plate: string;
  /** Vehiculul are deja Premium — opțiunea de upgrade dispare. */
  paid: boolean;
  onReverify: () => void;
  onUpgrade: () => void;
  onDelete: () => void;
};

const ITEM =
  "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700";

/** Meniul ⚙ de pe cardul vehiculului: setările care nu au loc pe card. */
export function VehicleMenu({ plate, paid, onReverify, onUpgrade, onDelete }: VehicleMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Se închide la click în afara lui și la Escape, ca orice meniu.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setConfirmDelete(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        onClick={() => {
          setConfirmDelete(false);
          setOpen((o) => !o);
        }}
        aria-label={`Setări ${plate}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2 -m-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5"
        >
          {confirmDelete ? (
            <div className="p-2">
              <p className="text-sm text-slate-700">
                Ștergi <strong>{plate}</strong>? Ai 30 de secunde să anulezi.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                >
                  Nu
                </button>
                <button
                  onClick={() => {
                    close();
                    onDelete();
                  }}
                  className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Da, șterge
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                role="menuitem"
                onClick={() => {
                  close();
                  onReverify();
                }}
                className={`${ITEM} text-slate-700 hover:bg-slate-50`}
              >
                <RefreshCw size={15} className="text-slate-400 shrink-0" aria-hidden />
                Am reînnoit un act — verifică din nou
              </button>
              {!paid && (
                <button
                  role="menuitem"
                  onClick={() => {
                    close();
                    onUpgrade();
                  }}
                  className={`${ITEM} text-slate-700 hover:bg-slate-50`}
                >
                  <Zap size={15} className="text-brand shrink-0" aria-hidden />
                  Premium pentru acest vehicul
                </button>
              )}
              <div className="my-1 border-t border-slate-100" />
              <button
                role="menuitem"
                onClick={() => setConfirmDelete(true)}
                className={`${ITEM} text-red-600 hover:bg-red-50`}
              >
                <Trash2 size={15} className="shrink-0" aria-hidden />
                Șterge vehiculul
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
