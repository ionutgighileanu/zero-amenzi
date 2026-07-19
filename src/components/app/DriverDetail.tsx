"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DocLine } from "@/components/app/DocLine";
import { AddDocForm } from "@/components/app/AddDocForm";
import { DeleteConfirm } from "@/components/app/DeleteConfirm";
import { BRAND_BLUE } from "@/lib/constants";
import type { Driver, DriverCert } from "@/lib/vehicles";

const CERT_PRESETS = ["Atestat ADR", "Atestat marfă", "Aviz psihologic", "Fișă medicală", "Altul"];

export function driverInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}

type DriverDetailProps = {
  driver: Driver;
  onUpdate: (id: string, patch: { name: string; phone: string }) => void;
  onAddCert: (id: string, cert: DriverCert) => void;
  onDeleteCert: (id: string, index: number) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function DriverDetail({
  driver,
  onUpdate,
  onAddCert,
  onDeleteCert,
  onDelete,
  onClose,
}: DriverDetailProps) {
  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [adding, setAdding] = useState(false);
  const dirty = name.trim() !== driver.name || phone.trim() !== driver.phone;

  return (
    <Modal onClose={onClose} title="Detalii șofer">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span
            className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            {driverInitials(driver.name)}
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900 truncate">{driver.name}</p>
            <p className="text-sm text-slate-500">{driver.phone}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Date de contact
          </h4>
          <Input label="Nume complet" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {dirty && (
            <Button
              size="sm"
              onClick={() => onUpdate(driver.id, { name: name.trim(), phone: phone.trim() })}
            >
              Salvează modificările
            </Button>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Atestate și avize
            </h4>
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="text-sm font-semibold inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
                style={{ color: BRAND_BLUE }}
              >
                <Plus size={14} /> Adaugă
              </button>
            )}
          </div>
          {driver.certs.length === 0 && !adding && (
            <p className="text-sm text-slate-400 py-2">
              Niciun document. Adaugă atestate ADR, avize psihologice, fișe medicale…
            </p>
          )}
          {driver.certs.map((c, i) => (
            <DocLine
              key={`${c.type}-${i}`}
              label={c.type}
              date={c.expires}
              onDelete={() => onDeleteCert(driver.id, i)}
            />
          ))}
          {adding && (
            <div className="mt-2">
              <AddDocForm
                presets={CERT_PRESETS}
                onAdd={(doc) => {
                  onAddCert(driver.id, doc);
                  setAdding(false);
                }}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}
        </section>

        <div className="pt-4 border-t border-slate-100">
          <DeleteConfirm
            label="Șterge șoferul"
            onConfirm={() => {
              onDelete(driver.id);
              onClose();
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
