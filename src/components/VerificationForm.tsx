"use client";

import { useState } from "react";
import { Loader2, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { verifyPlate, type VerificationResult } from "@/lib/verify";

type Status = "idle" | "loading" | "found" | "not-found" | "error";

const STATUS_TONE: Record<string, string> = {
  valid: "border-slate-200 bg-slate-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  expired: "border-red-200 bg-red-50 text-red-700",
};

export function VerificationForm() {
  const [plate, setPlate] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim().length < 2) return;

    setStatus("loading");
    setResult(null);

    try {
      const data = await verifyPlate(plate);
      setResult(data);
      setStatus("found");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setStatus(message === "NOT_FOUND" ? "not-found" : "error");
    }
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={plate}
          onChange={(e) => {
            setPlate(e.target.value.toUpperCase());
            setStatus("idle");
            setResult(null);
          }}
          placeholder="B 100 ABC"
          disabled={status === "loading"}
          className="flex-1 border border-slate-300 rounded-xl px-3 py-3 text-base font-bold tracking-wider text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 disabled:bg-slate-50"
          required
        />
        <Button type="submit" size="lg" disabled={status === "loading"}>
          {status === "loading" ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <Search size={18} className="mr-2" />
          )}
          Verifică
        </Button>
      </form>

      {status === "loading" && (
        <p className="text-sm text-slate-500 mt-3" role="status" aria-live="polite">
          Verific actele...
        </p>
      )}

      {status === "not-found" && (
        <div
          className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800"
          role="alert"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            Nu am găsit numărul <strong>{plate.trim().toUpperCase()}</strong> — verifică
            dacă e corect.
          </span>
        </div>
      )}

      {status === "error" && (
        <div
          className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"
          role="alert"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>Eroare la verificare. Încearcă din nou.</span>
        </div>
      )}

      {status === "found" && result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-wider text-slate-900">
              {result.plate}
            </span>
            <span className="text-sm text-slate-500">{result.vehicle}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["itp", "rca", "rovinieta"] as const).map((key) => (
              <div
                key={key}
                className={`rounded-xl border p-3 ${STATUS_TONE[result[key].status]}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {key === "rovinieta" ? "Rovinietă" : key.toUpperCase()}
                </p>
                <p className="text-sm font-bold">{result[key].label}</p>
              </div>
            ))}
          </div>
          <Button className="w-full">Creează cont și activează alertele</Button>
        </div>
      )}
    </div>
  );
}
