"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { StatusCell } from "@/components/app/StatusCell";
import { CORE_DOC_TYPES } from "@/lib/vehicles";
import { ADMIN_DOC_HELPER_LINKS } from "@/lib/constants";
import { AddDocumentModal } from "@/components/admin/AddDocumentModal";
import { UpdateDocumentModal } from "@/components/admin/UpdateDocumentModal";
import type { Database } from "@/lib/supabase/database.types";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
type VehicleDocRow = Database["public"]["Tables"]["vehicle_docs"]["Row"];

// RCA, ITP, Rovinietă apar mereu, chiar dacă vehiculul nu are încă niciun
// rând pentru unul din ele — admin trebuie să poată adăuga primul document.
// Orice alt tip (Tahograf, tipuri custom) primește propria secțiune, în
// ordine alfabetică, doar dacă există deja cel puțin un rând.
const CORE_SECTION_TYPES: readonly string[] = [
  CORE_DOC_TYPES.rca,
  CORE_DOC_TYPES.itp,
  CORE_DOC_TYPES.rovinieta,
];

type VehicleDetailsProps = {
  vehicle: VehicleRow;
  initialDocs: VehicleDocRow[];
};

export function VehicleDetails({ vehicle, initialDocs }: VehicleDetailsProps) {
  const [docs, setDocs] = useState(initialDocs);
  const [addingType, setAddingType] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<VehicleDocRow | null>(null);

  const sections = useMemo(() => {
    const byType = new Map<string, VehicleDocRow[]>();
    for (const doc of docs) {
      const list = byType.get(doc.type) ?? [];
      list.push(doc);
      byType.set(doc.type, list);
    }
    const otherTypes = [...byType.keys()].filter((t) => !CORE_SECTION_TYPES.includes(t)).sort();
    return [...CORE_SECTION_TYPES, ...otherTypes].map((type) => ({
      type,
      docs: (byType.get(type) ?? []).sort((a, b) => a.expires_at.localeCompare(b.expires_at)),
    }));
  }, [docs]);

  const onCreated = (doc: VehicleDocRow) => {
    setDocs((list) => [...list, doc]);
    setAddingType(null);
  };

  const onUpdated = (doc: VehicleDocRow) => {
    setDocs((list) => list.map((d) => (d.id === doc.id ? doc : d)));
    setEditingDoc(null);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-7">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <Plate plate={vehicle.plate} size="lg" />
        {vehicle.model && <span className="text-sm text-slate-500">{vehicle.model}</span>}
      </div>
      <p className="text-sm text-slate-500 font-mono mt-1">VIN: {vehicle.vin}</p>

      <div className="mt-6 space-y-4">
        {sections.map((section) => (
          <DocSection
            key={section.type}
            type={section.type}
            docs={section.docs}
            onAdd={() => setAddingType(section.type)}
            onEdit={setEditingDoc}
          />
        ))}

        <Button variant="outline" size="sm" onClick={() => setAddingType("")}>
          <Plus size={16} className="mr-1.5" /> Adaugă document (alt tip)
        </Button>
      </div>

      {addingType !== null && (
        <AddDocumentModal
          vehicleId={vehicle.id}
          defaultType={addingType}
          onClose={() => setAddingType(null)}
          onCreated={onCreated}
        />
      )}
      {editingDoc && (
        <UpdateDocumentModal
          vehicleId={vehicle.id}
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onUpdated={onUpdated}
        />
      )}
    </main>
  );
}

function DocSection({
  type,
  docs,
  onAdd,
  onEdit,
}: {
  type: string;
  docs: VehicleDocRow[];
  onAdd: () => void;
  onEdit: (doc: VehicleDocRow) => void;
}) {
  const helper = ADMIN_DOC_HELPER_LINKS[type];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900 font-display">{type}</h2>
        {helper && (
          <a
            href={helper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
          >
            Verifică pe {helper.label} <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        {docs.length === 0 && <p className="py-2 text-sm text-slate-500">Niciun document încă.</p>}
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between gap-3 py-2">
            <StatusCell date={doc.expires_at} />
            <Button variant="ghost" size="sm" onClick={() => onEdit(doc)}>
              <Pencil size={14} className="mr-1.5" /> Actualizează
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-2">
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus size={14} className="mr-1.5" /> Adaugă {type}
        </Button>
      </div>
    </div>
  );
}
