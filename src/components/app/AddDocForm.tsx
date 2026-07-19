"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type AddDocFormProps = {
  presets: string[];
  onAdd: (doc: { type: string; expires: string }) => void;
  onCancel: () => void;
};

export function AddDocForm({ presets, onAdd, onCancel }: AddDocFormProps) {
  const [type, setType] = useState(presets[0]);
  const [custom, setCustom] = useState("");
  const [date, setDate] = useState("");
  const finalType = type === "Altul" ? custom.trim() : type;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!finalType || !date) return;
    onAdd({ type: finalType, expires: date });
  };

  return (
    <form onSubmit={submit} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Tip document
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm font-normal bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            {presets.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      {type === "Altul" && (
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Denumire document"
          className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
        />
      )}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Expiră la
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          Renunță
        </Button>
        <Button type="submit" size="sm" className="flex-1" disabled={!finalType || !date}>
          Adaugă
        </Button>
      </div>
    </form>
  );
}
