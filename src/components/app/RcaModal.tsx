"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { BRAND_BLUE, RCA_OFFERS, type RcaOffer } from "@/lib/constants";
import type { Vehicle } from "@/lib/vehicles";

type RcaModalProps = {
  vehicle: Vehicle;
  onClose: () => void;
};

export function RcaModal({ vehicle, onClose }: RcaModalProps) {
  const [chosen, setChosen] = useState<RcaOffer | null>(null);

  return (
    <Modal
      onClose={onClose}
      title="Reînnoiește RCA"
      subtitle="Oferte în timp real de la asigurători, pentru 12 luni."
      wide
    >
      <div className="mb-4">
        <Plate plate={vehicle.plate} size="sm" />
      </div>
      {chosen ? (
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">
            Poliță {chosen.insurer} selectată
          </h4>
          <p className="text-sm text-slate-500 mb-6">
            Urmează pagina securizată de plată. După confirmare, data RCA se
            actualizează automat în cont.
          </p>
          <Button size="sm" onClick={onClose} className="w-full">
            Continuă spre plată · {chosen.price} lei
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {RCA_OFFERS.map((o) => (
            <li key={o.insurer}>
              <button
                onClick={() => setChosen(o)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${o.best ? "border-blue-700 bg-blue-50/50" : "border-slate-200 hover:border-slate-400"}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{o.insurer}</span>
                    {o.best && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide text-white rounded px-1.5 py-0.5"
                        style={{ backgroundColor: BRAND_BLUE }}
                      >
                        Cel mai bun preț
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    Valabilitate 12 luni · emitere instant
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-bold text-slate-900 font-display">
                    {o.price} lei
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
