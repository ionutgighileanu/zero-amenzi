"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createOrganizationAction, type CreateOrgState } from "@/lib/actions/organizations";

const initialState: CreateOrgState = null;

export function NewOrganizationForm() {
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialState);

  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6">
      <Input label="Nume firmă" name="name" placeholder="TransLog SRL" required autoFocus />
      <Input label="CUI" name="cui" placeholder="RO12345678" />
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? "Se creează…" : "Creează firma"}
      </Button>
    </form>
  );
}
