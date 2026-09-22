import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Plate } from "@/components/ui/Plate";
import { StatusCell } from "@/components/app/StatusCell";
import { formatDate, formatDateTime } from "@/lib/status";
import { fetchAdminUserDetail } from "@/lib/admin/users";

export const metadata: Metadata = {
  title: "Utilizator — Admin",
  description: "Panou intern: tot ce ține de un cont — spații, vehicule, documente, cereri.",
};

const CARD = "bg-white border border-slate-200 rounded-2xl";
const LABEL = "text-[11px] font-bold uppercase tracking-wider text-slate-500";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await fetchAdminUserDetail(id);
  if (!detail) notFound();

  const { user, vehicles, docs, requests, pushEndpoints } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={14} /> Toți utilizatorii
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight font-display mt-2 break-all">
          {user.email}
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">{user.id}</p>
      </div>

      <section className={`${CARD} p-4 grid grid-cols-2 sm:grid-cols-4 gap-4`}>
        <Field label="Cont creat" value={user.createdAt ? formatDate(user.createdAt) : "—"} />
        <Field
          label="Ultima intrare"
          value={user.lastSignInAt ? formatDateTime(user.lastSignInAt) : "niciodată"}
        />
        <Field
          label="Autentificare"
          value={`${user.provider}${user.emailConfirmed ? "" : " · neconfirmat"}`}
        />
        <Field
          label="Alerte"
          value={`email ${user.emailNotifications ? "da" : "nu"} · push ${user.pushDevices}`}
        />
      </section>

      <section>
        <h2 className={`${LABEL} mb-2`}>Spații ({user.spaces.length})</h2>
        <div className={CARD}>
          {user.spaces.length === 0 ? (
            <p className="p-4 text-sm text-red-600">
              Contul nu are niciun spațiu — ar fi trebuit creat automat la înregistrare.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {user.spaces.map((s) => (
                <li key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {s.name}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        · {s.kind === "personal" ? "personal" : "flotă"} · {s.role}
                        {s.isOwner ? " (proprietar)" : ""}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{s.id}</p>
                  </div>
                  <span className="text-xs text-slate-600">
                    {s.subscriptionStatus} · gratuit până la {formatDate(s.trialEndsAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className={`${LABEL} mb-2`}>Vehicule ({vehicles.length})</h2>
        <div className={CARD}>
          {vehicles.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Niciun vehicul.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {vehicles.map((v) => {
                const own = docs.filter((d) => d.vehicleId === v.id);
                return (
                  <li key={v.id} className={`p-4 ${v.deletedAt ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <Plate plate={v.plate} size="sm" />
                      <span className="text-xs text-slate-500 font-mono">{v.vin}</span>
                      <span className="text-xs text-slate-500">{v.spaceName}</span>
                      <span
                        className={`text-xs font-medium ${v.access === "paid" ? "text-brand" : v.access === "locked" ? "text-red-700" : "text-slate-600"}`}
                      >
                        {v.access === "paid"
                          ? `plătit până la ${formatDate(v.paidUntil)}`
                          : v.access === "locked"
                            ? "blocat"
                            : "perioadă gratuită"}
                      </span>
                      {v.deletedAt && (
                        <span className="text-xs text-red-600">șters {formatDate(v.deletedAt)}</span>
                      )}
                      <Link
                        href={`/admin/vehicles/${v.id}`}
                        className="ml-auto text-xs font-semibold text-brand hover:underline"
                      >
                        Editează documentele
                      </Link>
                    </div>
                    {own.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {own.map((d) => (
                          <li
                            key={`${d.vehicleId}-${d.type}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-sm text-slate-600">{d.type}</span>
                            <StatusCell date={d.expiresAt} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className={`${LABEL} mb-2`}>Cereri de verificare ({requests.length})</h2>
        <div className={CARD}>
          {requests.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Nicio cerere.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {requests.map((r) => (
                <li key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Plate plate={r.plate} size="sm" />
                    <span
                      className={`text-xs font-medium ${r.status === "pending" ? "text-amber-700" : "text-emerald-700"}`}
                    >
                      {r.status === "pending" ? "în așteptare" : "completată"}
                    </span>
                    {r.vehicleId && <span className="text-xs text-slate-500">din garaj</span>}
                  </div>
                  <span className="text-xs text-slate-500">
                    cerută {formatDateTime(r.createdAt)}
                    {r.adminNotifiedAt ? ` · în digest ${formatDateTime(r.adminNotifiedAt)}` : ""}
                    {r.completedAt ? ` · gata ${formatDateTime(r.completedAt)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className={`${LABEL} mb-2`}>Dispozitive cu push ({pushEndpoints.length})</h2>
        <div className={CARD}>
          {pushEndpoints.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Niciun dispozitiv.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pushEndpoints.map((p) => (
                <li key={`${p.host}-${p.createdAt}`} className="p-4 flex justify-between gap-3">
                  <span className="text-sm text-slate-700">{p.host}</span>
                  <span className="text-xs text-slate-500">{formatDateTime(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
