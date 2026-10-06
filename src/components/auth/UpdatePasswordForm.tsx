"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updatePasswordAction, type UpdatePasswordState } from "@/lib/actions/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants";

const initialState: UpdatePasswordState = null;

/** Pasul 2 din recuperare: setează parola nouă pe sesiunea de recuperare. */
export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <div className="min-h-screen bg-slate-50 flex-1 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-sm">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-lg"
        >
          <span className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
            <Shield className="text-white" size={22} />
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
            AutoDocs
          </span>
        </Link>
        <p className="text-center text-sm text-slate-500 mb-8">Alege o parolă nouă.</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 font-display mb-5">
            Parolă nouă
          </h1>
          <form className="space-y-4" action={formAction}>
            <Input
              label="Parolă nouă"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={MIN_PASSWORD_LENGTH}
              hint={`Minim ${MIN_PASSWORD_LENGTH} caractere.`}
            />
            {state?.error && (
              <p className="text-sm text-red-600" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" size="sm" className="w-full" disabled={pending}>
              {pending ? "Se salvează…" : "Salvează parola"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link
            href="/login"
            className="font-semibold text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
          >
            Înapoi la conectare
          </Link>
        </p>
      </div>
    </div>
  );
}
