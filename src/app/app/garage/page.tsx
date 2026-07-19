"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MOCK_VEHICLES, type Vehicle } from "@/lib/vehicles";

const UNDO_WINDOW_MS = 30_000;

export default function GaragePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleDelete = (id: string) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, deleted_at: new Date().toISOString() } : v))
    );
    setPendingId(id);

    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setPendingId((current) => (current === id ? null : current));
    }, UNDO_WINDOW_MS);
  };

  const handleUndo = (id: string) => {
    clearPendingTimeout();
    setPendingId(null);
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, deleted_at: null } : v))
    );
  };

  const visibleVehicles = vehicles.filter((v) => v.deleted_at === null);
  const pendingVehicle = vehicles.find((v) => v.id === pendingId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-6">
        Garajul meu
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {visibleVehicles.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3"
          >
            <div>
              <p className="text-sm font-bold tracking-wider text-slate-900">{v.plate}</p>
              <p className="text-xs text-slate-500 mt-0.5">{v.model}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleDelete(v.id)}
                aria-label={`Șterge ${v.plate}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
              >
                <Trash2 size={15} /> Șterge
              </button>
            </div>
          </div>
        ))}
      </div>

      {pendingVehicle && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-xl shadow-xl px-5 py-3.5 flex items-center gap-4"
        >
          <span className="text-sm">Vehicul șters: {pendingVehicle.plate}.</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => handleUndo(pendingVehicle.id)}
          >
            Undo
          </Button>
        </div>
      )}
    </div>
  );
}
