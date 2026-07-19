"use client";

import { useState } from "react";
import { Bell, Check, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BRAND_BLUE, MAX_ALERTS, PRESET_ALERTS } from "@/lib/constants";

type AlertTypesModalProps = {
  selected: string[];
  onSave: (types: string[]) => void;
  onClose: () => void;
};

export function AlertTypesModal({ selected, onSave, onClose }: AlertTypesModalProps) {
  const [local, setLocal] = useState(selected);
  const [custom, setCustom] = useState("");
  const all = [...new Set([...PRESET_ALERTS, ...local])];

  const toggle = (t: string) =>
    setLocal((l) =>
      l.includes(t) ? l.filter((x) => x !== t) : l.length >= MAX_ALERTS ? l : [...l, t]
    );

  const addCustom = () => {
    const t = custom.trim();
    if (t && !local.includes(t) && local.length < MAX_ALERTS) {
      setLocal([...local, t]);
      setCustom("");
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Selectează tipuri de alerte"
      subtitle="Se aplică tuturor vehiculelor."
      wide
    >
      <div className="flex flex-wrap gap-2">
        {all.map((t) => {
          const on = local.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${on ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-600 hover:border-slate-400"}`}
            >
              {on && <Check size={14} />} {t}
            </button>
          );
        })}
      </div>

      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Adaugă alertă personalizată
          <span className="flex gap-2 mt-1.5">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Ex: Schimb roți"
              maxLength={30}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
            <Button
              size="sm"
              onClick={addCustom}
              disabled={!custom.trim() || local.length >= MAX_ALERTS}
              aria-label="Adaugă"
            >
              <Plus size={16} />
            </Button>
          </span>
        </label>
      </div>

      <div
        className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-lg py-2 bg-blue-50"
        style={{ color: BRAND_BLUE }}
      >
        <Bell size={14} /> {local.length} / {MAX_ALERTS} alerte selectate
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
          Anulează
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => {
            onSave(local);
            onClose();
          }}
        >
          Salvează
        </Button>
      </div>
    </Modal>
  );
}
