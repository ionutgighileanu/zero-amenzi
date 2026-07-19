"use client";

import { use, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Car,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { StatusCell } from "@/components/app/StatusCell";
import { VehicleDetail } from "@/components/app/VehicleDetail";
import { DriverDetail, driverInitials } from "@/components/app/DriverDetail";
import { AddVehicleModal } from "@/components/app/AddVehicleModal";
import { AddDriverModal } from "@/components/app/AddDriverModal";
import { AlertTypesModal } from "@/components/app/AlertTypesModal";
import { RcaModal } from "@/components/app/RcaModal";
import { CascoModal } from "@/components/app/CascoModal";
import { UndoBanner } from "@/components/app/UndoBanner";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { daysUntil, getStatus } from "@/lib/status";
import { BRAND_BLUE, DEFAULT_ALERT_TYPES } from "@/lib/constants";
import {
  MOCK_DRIVERS,
  MOCK_ORG,
  MOCK_VEHICLES_B2B,
  createDriver,
  createVehicle,
  minDays,
  vehicleStatus,
  type Driver,
  type DriverCert,
  type Vehicle,
  type VehicleDoc,
} from "@/lib/vehicles";

type SortCol = "urgency" | "rca" | "itp" | "rovinieta" | "tahograf";
type Sort = { col: SortCol; dir: "asc" | "desc" };
type Tab = "vehicles" | "drivers";
type Filter = "all" | "problems" | "expired";

const SORT_KEYS: Record<SortCol, (v: Vehicle) => number> = {
  urgency: minDays,
  rca: (v) => daysUntil(v.rca) ?? Infinity,
  itp: (v) => daysUntil(v.itp) ?? Infinity,
  rovinieta: (v) => daysUntil(v.rovinieta) ?? Infinity,
  tahograf: (v) => daysUntil(v.tahograf) ?? Infinity,
};

function SortHeader({
  label,
  col,
  sort,
  setSort,
}: {
  label: string;
  col: SortCol;
  sort: Sort;
  setSort: (s: Sort) => void;
}) {
  const active = sort.col === col;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => setSort({ col, dir: active && sort.dir === "asc" ? "desc" : "asc" })}
        className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded ${active ? "text-slate-900" : "text-slate-400"}`}
      >
        {label} <Icon size={12} />
      </button>
    </th>
  );
}

export default function FleetPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const orgName = orgId === MOCK_ORG.id ? MOCK_ORG.name : orgId;

  const {
    visible: vehicles,
    setItems: setVehicles,
    pendingItem: pendingVehicle,
    softDelete: softDeleteVehicle,
    undo: undoVehicle,
  } = useSoftDelete<Vehicle>(MOCK_VEHICLES_B2B);

  const {
    visible: drivers,
    setItems: setDrivers,
    pendingItem: pendingDriver,
    softDelete: softDeleteDriver,
    undo: undoDriver,
  } = useSoftDelete<Driver>(MOCK_DRIVERS);

  const [tab, setTab] = useState<Tab>("vehicles");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>({ col: "urgency", dir: "asc" });

  const [alertTypes, setAlertTypes] = useState<string[]>(DEFAULT_ALERT_TYPES);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [rcaVehicle, setRcaVehicle] = useState<Vehicle | null>(null);
  const [cascoVehicle, setCascoVehicle] = useState<Vehicle | null>(null);
  const [detailVehicleId, setDetailVehicleId] = useState<string | null>(null);
  const [detailDriverId, setDetailDriverId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      expired: vehicles.filter((v) => vehicleStatus(v) === "expired").length,
      warning: vehicles.filter((v) => vehicleStatus(v) === "warning").length,
      valid: vehicles.filter((v) => vehicleStatus(v) === "valid").length,
    }),
    [vehicles]
  );

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    let list = vehicles.filter(
      (v) => v.plate.toLowerCase().includes(q) || v.vin.toLowerCase().includes(q)
    );
    if (filter === "problems") list = list.filter((v) => vehicleStatus(v) !== "valid");
    if (filter === "expired") list = list.filter((v) => vehicleStatus(v) === "expired");
    const dir = sort.dir === "asc" ? 1 : -1;
    const key = SORT_KEYS[sort.col];
    return [...list].sort((a, b) => (key(a) - key(b)) * dir);
  }, [vehicles, query, filter, sort]);

  const problemCount = counts.expired + counts.warning;
  const detailVehicle = detailVehicleId
    ? vehicles.find((v) => v.id === detailVehicleId)
    : null;
  const detailDriver = detailDriverId ? drivers.find((d) => d.id === detailDriverId) : null;

  const addVehicle = (plate: string, vin: string) =>
    setVehicles((list) => [createVehicle(plate, vin), ...list]);
  const addVehicleDoc = (id: string, doc: VehicleDoc) =>
    setVehicles((list) =>
      list.map((v) => (v.id === id ? { ...v, docs: [...(v.docs ?? []), doc] } : v))
    );
  const deleteVehicleDoc = (id: string, idx: number) =>
    setVehicles((list) =>
      list.map((v) =>
        v.id === id ? { ...v, docs: (v.docs ?? []).filter((_, i) => i !== idx) } : v
      )
    );

  const addDriver = (name: string, phone: string) =>
    setDrivers((list) => [...list, createDriver(name, phone)]);
  const updateDriver = (id: string, patch: { name: string; phone: string }) =>
    setDrivers((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const addDriverCert = (id: string, cert: DriverCert) =>
    setDrivers((list) =>
      list.map((d) => (d.id === id ? { ...d, certs: [...d.certs, cert] } : d))
    );
  const deleteDriverCert = (id: string, idx: number) =>
    setDrivers((list) =>
      list.map((d) =>
        d.id === id ? { ...d, certs: d.certs.filter((_, i) => i !== idx) } : d
      )
    );

  const onDrivers = tab === "drivers";

  const kpis = [
    { id: "expired" as const, label: "Expirate", value: counts.expired, tone: "text-red-600" },
    { id: "problems" as const, label: "Expiră ≤ 15 zile", value: counts.warning, tone: "text-amber-600" },
    { id: "all" as const, label: "În regulă", value: counts.valid, tone: "text-slate-900" },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
            {orgName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {problemCount === 0
              ? "Toate documentele sunt în regulă."
              : `${problemCount} ${problemCount === 1 ? "vehicul cere" : "vehicule cer"} atenție. Restul e în regulă.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAlertsOpen(true)}>
            <Settings size={16} className="mr-1.5" /> Tipuri alerte
          </Button>
          <Button
            size="sm"
            onClick={() => (onDrivers ? setAddDriverOpen(true) : setAddVehicleOpen(true))}
          >
            <Plus size={16} className="mr-1.5" /> {onDrivers ? "Adaugă șofer" : "Adaugă vehicul"}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* KPI — răspunsul la „ce arde azi?", filtrele sunt chiar cifrele */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {kpis.map((k) => (
            <button
              key={k.id}
              onClick={() => setFilter(filter === k.id ? "all" : k.id)}
              className={`bg-white rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${filter === k.id && k.id !== "all" ? "border-slate-900" : "border-slate-200 hover:border-slate-400"}`}
            >
              <div className={`text-2xl sm:text-3xl font-extrabold font-display ${k.tone}`}>
                {k.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{k.label}</div>
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs + căutare */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 pt-4 pb-0 sm:pb-4 border-b border-slate-100">
            <nav className="flex gap-6" aria-label="Secțiuni">
              {(
                [
                  ["vehicles", "Vehicule", vehicles.length, Car],
                  ["drivers", "Șoferi", drivers.length, Users],
                ] as const
              ).map(([id, label, n, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`pb-3 sm:pb-0 inline-flex items-center gap-2 text-sm font-semibold border-b-2 sm:border-b-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-sm ${tab === id ? "text-slate-900 border-slate-900" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                >
                  <Icon size={16} /> {label}
                  <span
                    className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 ${tab === id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {n}
                  </span>
                </button>
              ))}
            </nav>
            {tab === "vehicles" && (
              <div className="relative sm:ml-auto pb-3 sm:pb-0">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 -mt-1.5 sm:mt-0 text-slate-400 pointer-events-none"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Caută număr sau VIN"
                  className="w-full sm:w-64 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                />
              </div>
            )}
          </div>

          {tab === "vehicles" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/70">
                  <tr>
                    <SortHeader label="Vehicul" col="urgency" sort={sort} setSort={setSort} />
                    <SortHeader label="RCA" col="rca" sort={sort} setSort={setSort} />
                    <SortHeader label="ITP" col="itp" sort={sort} setSort={setSort} />
                    <SortHeader label="Rovinietă" col="rovinieta" sort={sort} setSort={setSort} />
                    <SortHeader label="Tahograf" col="tahograf" sort={sort} setSort={setSort} />
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => setDetailVehicleId(v.id)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Plate plate={v.plate} size="sm" />
                          {v.truck && (
                            <Truck size={14} className="text-slate-300" aria-label="Camion" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusCell date={v.rca} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusCell date={v.itp} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusCell date={v.rovinieta} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusCell date={v.tahograf} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {getStatus(v.rca) !== "valid" && (
                            <Button
                              size="sm"
                              variant={getStatus(v.rca) === "expired" ? "danger" : "primary"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRcaVehicle(v);
                              }}
                            >
                              RCA
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCascoVehicle(v);
                            }}
                          >
                            CASCO
                          </Button>
                          <ChevronRight size={16} className="text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                        Niciun vehicul nu se potrivește. Șterge căutarea sau filtrul activ.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/70">
                  <tr>
                    {["Șofer", "Telefon", "Atestate și avize", ""].map((h, i) => (
                      <th
                        key={h || "actions"}
                        className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 ${i === 3 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setDetailDriverId(d.id)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: BRAND_BLUE }}
                          >
                            {driverInitials(d.name)}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-500">
                        {d.phone}
                      </td>
                      <td className="px-4 py-3.5">
                        {d.certs.length === 0 ? (
                          <span className="text-sm text-slate-400">Fără documente încă</span>
                        ) : (
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {d.certs.map((c) => (
                              <span
                                key={c.type}
                                className="inline-flex items-center gap-1.5 text-sm text-slate-600"
                              >
                                {c.type} <StatusCell date={c.expires} />
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                          Detalii <ChevronRight size={14} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {addVehicleOpen && (
        <AddVehicleModal onClose={() => setAddVehicleOpen(false)} onSubmit={addVehicle} />
      )}
      {addDriverOpen && (
        <AddDriverModal onClose={() => setAddDriverOpen(false)} onSubmit={addDriver} />
      )}
      {alertsOpen && (
        <AlertTypesModal
          selected={alertTypes}
          onSave={setAlertTypes}
          onClose={() => setAlertsOpen(false)}
        />
      )}
      {detailVehicle && (
        <VehicleDetail
          vehicle={detailVehicle}
          isB2B
          alertTypes={alertTypes}
          onRca={setRcaVehicle}
          onCasco={setCascoVehicle}
          onAddDoc={addVehicleDoc}
          onDeleteDoc={deleteVehicleDoc}
          onDelete={softDeleteVehicle}
          onClose={() => setDetailVehicleId(null)}
        />
      )}
      {detailDriver && (
        <DriverDetail
          driver={detailDriver}
          onUpdate={updateDriver}
          onAddCert={addDriverCert}
          onDeleteCert={deleteDriverCert}
          onDelete={softDeleteDriver}
          onClose={() => setDetailDriverId(null)}
        />
      )}
      {rcaVehicle && <RcaModal vehicle={rcaVehicle} onClose={() => setRcaVehicle(null)} />}
      {cascoVehicle && <CascoModal vehicle={cascoVehicle} onClose={() => setCascoVehicle(null)} />}
      {pendingVehicle && (
        <UndoBanner
          message={`Vehicul șters: ${pendingVehicle.plate}.`}
          onUndo={() => undoVehicle(pendingVehicle.id)}
        />
      )}
      {!pendingVehicle && pendingDriver && (
        <UndoBanner
          message={`Șofer șters: ${pendingDriver.name}.`}
          onUndo={() => undoDriver(pendingDriver.id)}
        />
      )}
    </main>
  );
}
