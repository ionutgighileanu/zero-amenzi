"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Search } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/status";
import { StatusCell } from "@/components/app/StatusCell";
import { CORE_DOC_TYPES } from "@/lib/vehicles";
import { compactSearch, normalizeSearch } from "@/lib/searchText";
import type { AdminUserRow } from "@/lib/admin/users";

/** Cele trei acte obligatorii, în ordinea din tabel. */
const CORE_TYPES = [CORE_DOC_TYPES.rca, CORE_DOC_TYPES.itp, CORE_DOC_TYPES.rovinieta];

type SortKey = "createdAt" | "lastSignInAt" | "vehicles" | "requests" | "rca" | "itp" | "rovinieta";

const HEADERS: { key: SortKey | null; label: string }[] = [
  { key: null, label: "Utilizator" },
  { key: "createdAt", label: "Cont creat" },
  { key: "lastSignInAt", label: "Ultima intrare" },
  { key: null, label: "Spații" },
  { key: "vehicles", label: "Vehicule" },
  { key: "requests", label: "Cereri" },
  { key: "rca", label: "RCA" },
  { key: "itp", label: "ITP" },
  { key: "rovinieta", label: "Rovinietă" },
  { key: null, label: "Alerte" },
];

const SORTERS: Record<SortKey, (u: AdminUserRow) => string | number> = {
  createdAt: (u) => u.createdAt ?? "",
  lastSignInAt: (u) => u.lastSignInAt ?? "",
  vehicles: (u) => u.vehiclesActive,
  requests: (u) => u.requestsTotal,
  // Pe acte, sortarea începe cu cel mai urgent: inversăm semnul, fiindcă
  // sortarea e descrescătoare. Conturile fără actul respectiv ajung ultimele.
  rca: (u) => docDays(u, CORE_DOC_TYPES.rca),
  itp: (u) => docDays(u, CORE_DOC_TYPES.itp),
  rovinieta: (u) => docDays(u, CORE_DOC_TYPES.rovinieta),
};

function docDays(u: AdminUserRow, type: string): number {
  const doc = u.docsByType[type];
  return doc ? -doc.days : -Infinity;
}

export function UsersAdminTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt");

  const rows = useMemo(() => {
    // Două potriviri: una pe text (email, nume de flotă), una pe forma
    // compactă (plăcuță, VIN, CUI), ca „b100abc" să găsească „B 100 ABC"
    // și „12345678" să găsească „RO12345678".
    const q = normalizeSearch(query.trim());
    const qCompact = compactSearch(query);
    const filtered = q
      ? users.filter(
          (u) => u.searchText.includes(q) || (qCompact.length > 0 && u.searchCompact.includes(qCompact))
        )
      : users;
    const key = SORTERS[sort];
    // Descrescător peste tot: cei mai noi și cei cu cele mai multe primii.
    return [...filtered].sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0));
  }, [users, query, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight font-display">Utilizatori</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {users.length} {users.length === 1 ? "cont" : "conturi"}, cu tot ce au în baza de date.
          </p>
        </div>
        <label className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email, număr, VIN, firmă, CUI"
            aria-label="Caută după email, număr de înmatriculare, VIN, firmă sau CUI"
            className="w-64 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/70">
            <tr>
              {HEADERS.map(({ key, label }) => (
                <th
                  key={label}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  {key ? (
                    <button
                      onClick={() => setSort(key)}
                      className={`hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded ${sort === key ? "text-slate-900" : ""}`}
                    >
                      {label}
                    </button>
                  ) : (
                    label
                  )}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-sm font-semibold text-slate-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
                  >
                    {u.email}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {u.provider}
                    {!u.emailConfirmed && " · email neconfirmat"}
                    {u.missingProfile && (
                      <span className="text-red-600 font-medium"> · fără rând în users</span>
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {u.createdAt ? formatDate(u.createdAt) : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {u.lastSignInAt ? formatDateTime(u.lastSignInAt) : "niciodată"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {u.spaces.length === 0 ? (
                    <span className="text-red-600 font-medium inline-flex items-center gap-1">
                      <AlertTriangle size={13} aria-hidden /> niciun spațiu
                    </span>
                  ) : (
                    u.spaces
                      .map((s) => (s.kind === "personal" ? "personal" : `flotă: ${s.name}`))
                      .join(", ")
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {u.vehiclesActive}
                  {u.vehiclesPaid > 0 && (
                    <span className="text-brand font-medium"> · {u.vehiclesPaid} plătite</span>
                  )}
                  {u.vehiclesDeleted > 0 && (
                    <span className="text-slate-400"> · {u.vehiclesDeleted} șterse</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {u.requestsTotal}
                  {u.requestsPending > 0 && (
                    <span className="text-amber-700 font-medium">
                      {" "}
                      · {u.requestsPending} în așteptare
                    </span>
                  )}
                </td>
                {CORE_TYPES.map((type) => {
                  const doc = u.docsByType[type];
                  return (
                    <td key={type} className="px-4 py-3 whitespace-nowrap">
                      {doc ? (
                        <span title={`${type} · ${doc.plate}`}>
                          <StatusCell date={doc.expiresAt} />
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                  email {u.emailNotifications ? "da" : "nu"} · push {u.pushDevices}
                  {u.notificationsUnread > 0 && ` · ${u.notificationsUnread} necitite`}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    aria-label={`Detalii ${u.email}`}
                    className="text-slate-300 hover:text-slate-600 inline-flex"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-500">
                  Niciun utilizator pentru „{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
