"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type AddDriverModalProps = {
  onClose: () => void;
  onSubmit: (name: string, phone: string) => void;
};

export function AddDriverModal({ onClose, onSubmit }: AddDriverModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(name.trim(), phone.trim());
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Adaugă un șofer"
      subtitle="Atestatele și avizele le atașezi după salvare."
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="Nume complet"
          placeholder="Ion Popescu"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Telefon"
          type="tel"
          placeholder="0722 123 456"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div className="pt-2 flex gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            Anulează
          </Button>
          <Button type="submit" size="sm" className="flex-1">
            Salvează șoferul
          </Button>
        </div>
      </form>
    </Modal>
  );
}
