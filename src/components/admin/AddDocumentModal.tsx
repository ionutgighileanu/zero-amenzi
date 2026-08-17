"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ADMIN_DOC_HELPER_LINKS } from "@/lib/constants";
import { DOC_TYPE_OPTIONS, OTHER_DOC_TYPE, splitDocType } from "@/lib/adminDocTypes";
import { adminAddVehicleDocAction } from "@/lib/actions/adminVehicles";
import type { Database } from "@/lib/supabase/database.types";

type VehicleDocRow = Database["public"]["Tables"]["vehicle_docs"]["Row"];

type AddDocumentModalProps = {
  vehicleId: string;
  /** Tipul preselectat (ex. secțiunea RCA a deschis modalul) — "" dacă
   * adminul pornește de la butonul generic „Adaugă document (alt tip)". */
  defaultType: string;
  onClose: () => void;
  onCreated: (doc: VehicleDocRow) => void;
};

export function AddDocumentModal({ vehicleId, defaultType, onClose, onCreated }: AddDocumentModalProps) {
  const initial = splitDocType(defaultType);
  const [type, setType] = useState(initial.select);
  const [customType, setCustomType] = useState(initial.custom);
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedType = type === OTHER_DOC_TYPE ? customType.trim() : type;
  const helper = ADMIN_DOC_HELPER_LINKS[resolvedType];

  const submit = async () => {
    if (!resolvedType) {
      setError("Introdu tipul documentului.");
      return;
    }
    if (!expiresAt) {
      setError("Introdu data expirării.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const doc = await adminAddVehicleDocAction(vehicleId, resolvedType, expiresAt);
      onCreated(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut adăuga documentul.");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Adaugă document">
      <div className="space-y-4">
        {helper && (
          <a
            href={helper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
          >
            Verifică pe {helper.label} <ExternalLink size={14} />
          </a>
        )}

        <Select
          label="Tip document"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={DOC_TYPE_OPTIONS}
        />
        {type === OTHER_DOC_TYPE && (
          <Input
            label="Tip personalizat"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="ex. Extinctor"
          />
        )}
        <Input
          label="Data expirării"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button size="sm" className="w-full" onClick={submit} disabled={saving}>
          {saving ? "Se salvează…" : "Adaugă"}
        </Button>
      </div>
    </Modal>
  );
}
