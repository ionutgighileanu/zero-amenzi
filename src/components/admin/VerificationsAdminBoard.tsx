"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { VERIFICATION_RESULT_OPTIONS, type VerificationResultValue } from "@/lib/constants";
import { completeVerificationAction } from "@/lib/actions/verification";
import type { Database } from "@/lib/supabase/database.types";

type VerificationRow = Database["public"]["Tables"]["verification_requests"]["Row"];

function formatRequestedAt(iso: string): string {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VerificationsAdminBoard({
  initialRequests,
  highlightId,
}: {
  initialRequests: VerificationRow[];
  highlightId?: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  // Linkul din emailul de notificare deschide direct cererea (?request=id).
  // Dacă a fost deja completată de altcineva, nu mai e în listă — no-op.
  const [selected, setSelected] = useState<VerificationRow | null>(
    highlightId ? (initialRequests.find((r) => r.id === highlightId) ?? null) : null
  );

  const onCompleted = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
        Cereri de verificare
      </h1>
      <p className="text-sm text-slate-500 mt-0.5">
        {requests.length === 0
          ? "Nicio cerere în așteptare."
          : `${requests.length} ${requests.length === 1 ? "cerere" : "cereri"} în așteptare, sortate după cea mai veche.`}
      </p>

      <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50/70">
            <tr>
              {["Plăcuță", "Email", "Cerut", ""].map((h, i) => (
                <th
                  key={h || "actions"}
                  className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 ${i === 3 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className="hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <Plate plate={r.plate_number} size="sm" />
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-500">
                  {r.email ?? "—"}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-500">
                  {formatRequestedAt(r.created_at)}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-right">
                  <ChevronRight size={16} className="text-slate-300 inline" />
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                  Nimic de completat momentan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <CompleteRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onCompleted={onCompleted}
        />
      )}
    </main>
  );
}

function CompleteRequestModal({
  request,
  onClose,
  onCompleted,
}: {
  request: VerificationRow;
  onClose: () => void;
  onCompleted: (id: string) => void;
}) {
  const [itp, setItp] = useState<VerificationResultValue>("valid");
  const [rca, setRca] = useState<VerificationResultValue>("valid");
  const [rovinieta, setRovinieta] = useState<VerificationResultValue>("valid");
  const [itpExpires, setItpExpires] = useState("");
  const [rcaExpires, setRcaExpires] = useState("");
  const [rovinietaExpires, setRovinietaExpires] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await completeVerificationAction(request.id, {
        itp,
        rca,
        rovinieta,
        itpExpires: itpExpires || null,
        rcaExpires: rcaExpires || null,
        rovinietaExpires: rovinietaExpires || null,
      });
      onCompleted(request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut salva rezultatul.");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Completează verificarea">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Plate plate={request.plate_number} size="lg" />
          {request.email && <span className="text-sm text-slate-500">{request.email}</span>}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="ITP"
              value={itp}
              onChange={(e) => setItp(e.target.value as VerificationResultValue)}
              options={VERIFICATION_RESULT_OPTIONS}
            />
            <Input
              label="Data expirării"
              type="date"
              value={itpExpires}
              onChange={(e) => setItpExpires(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="RCA"
              value={rca}
              onChange={(e) => setRca(e.target.value as VerificationResultValue)}
              options={VERIFICATION_RESULT_OPTIONS}
            />
            <Input
              label="Data expirării"
              type="date"
              value={rcaExpires}
              onChange={(e) => setRcaExpires(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Rovinietă"
              value={rovinieta}
              onChange={(e) => setRovinieta(e.target.value as VerificationResultValue)}
              options={VERIFICATION_RESULT_OPTIONS}
            />
            <Input
              label="Data expirării"
              type="date"
              value={rovinietaExpires}
              onChange={(e) => setRovinietaExpires(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button size="sm" className="w-full" onClick={submit} disabled={saving}>
          {saving ? "Se salvează…" : "Completează"}
        </Button>
      </div>
    </Modal>
  );
}
