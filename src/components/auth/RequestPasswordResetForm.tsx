"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  requestPasswordResetAction,
  type PasswordResetRequestState,
} from "@/lib/actions/auth";

const initialState: PasswordResetRequestState = null;

/** Pasul 1 din recuperare: cere adresa, trimite emailul cu linkul de reset. */
export function RequestPasswordResetForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

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
        <p className="text-center text-sm text-slate-500 mb-8">
          Recuperează accesul la contul tău.
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {state?.status === "sent" ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
                Verifică-ți email-ul
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Dacă există un cont cu acea adresă, ți-am trimis un link de
                resetare. Apasă-l ca să-ți alegi o parolă nouă.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 font-display mb-1">
                Ai uitat parola?
              </h1>
              <p className="text-sm text-slate-600 mb-5">
                Scrie adresa de email a contului și îți trimitem un link de resetare.
              </p>
              <form className="space-y-4" action={formAction}>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="nume@email.ro"
                  required
                />
                {state?.error && (
                  <p className="text-sm text-red-600" role="alert">
                    {state.error}
                  </p>
                )}
                <Button type="submit" size="sm" className="w-full" disabled={pending}>
                  {pending ? "Se trimite…" : "Trimite link de resetare"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Ți-ai amintit parola?{" "}
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
