"use client";

import { FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateEmailAction, updateNameAction, type AccountResult } from "@/lib/actions/account";
import { FIELD_MAX_LENGTH, EMAIL_MAX_LENGTH } from "@/lib/constants";

type AccountDetailsProps = {
  initialName: string;
  email: string;
  /** Adresa nouă care așteaptă confirmarea, dacă există o schimbare pornită. */
  pendingEmail: string | null;
};

function Feedback({ result }: { result: AccountResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p className="text-sm text-emerald-700 mt-2" role="status">
      {result.message}
    </p>
  ) : (
    <p className="text-sm text-red-600 mt-2" role="alert">
      {result.error}
    </p>
  );
}

export function AccountDetails({ initialName, email, pendingEmail }: AccountDetailsProps) {
  const [name, setName] = useState(initialName);
  const [nameResult, setNameResult] = useState<AccountResult | null>(null);
  const [savingName, startSavingName] = useTransition();

  const [newEmail, setNewEmail] = useState("");
  const [emailResult, setEmailResult] = useState<AccountResult | null>(null);
  const [savingEmail, startSavingEmail] = useTransition();

  const submitName = (e: FormEvent) => {
    e.preventDefault();
    setNameResult(null);
    startSavingName(async () => setNameResult(await updateNameAction(name)));
  };

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    setEmailResult(null);
    startSavingEmail(async () => {
      const result = await updateEmailAction(newEmail);
      setEmailResult(result);
      if (result.ok) setNewEmail("");
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
      <form onSubmit={submitName} className="p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <Input
              label="Nume"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={FIELD_MAX_LENGTH.fullName}
              autoComplete="name"
              placeholder="Cum să ne adresăm"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={savingName || name.trim() === initialName.trim() || !name.trim()}
          >
            {savingName ? "Se salvează…" : "Salvează"}
          </Button>
        </div>
        <Feedback result={nameResult} />
      </form>

      <form onSubmit={submitEmail} className="p-4">
        <p className="text-sm font-medium text-slate-700">Email</p>
        <p className="text-sm text-slate-900 mt-1 break-all">{email}</p>
        {pendingEmail && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            Schimbare în așteptare către <strong className="break-all">{pendingEmail}</strong>.
            Confirmă din emailul primit.
          </p>
        )}
        <div className="flex items-end gap-2 mt-3">
          <div className="flex-1 min-w-0">
            <Input
              label="Adresă nouă"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              maxLength={EMAIL_MAX_LENGTH}
              autoComplete="email"
              placeholder="email@exemplu.ro"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={savingEmail || !newEmail.trim()}>
            {savingEmail ? "Se trimite…" : "Schimbă"}
          </Button>
        </div>
        <Feedback result={emailResult} />
      </form>
    </div>
  );
}
