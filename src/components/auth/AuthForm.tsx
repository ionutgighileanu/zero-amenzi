"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Car, CheckCircle2, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PENDING_ORG_COOKIE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { signInAction, signUpAction, type AuthActionState } from "@/lib/actions/auth";

type Mode = "login" | "signup";
type Account = "B2C" | "B2B";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a7.15 7.15 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type AuthFormProps = {
  mode: Mode;
  defaultAccount?: Account;
};

const initialState: AuthActionState = null;

export function AuthForm({ mode, defaultAccount = "B2C" }: AuthFormProps) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/app/garage";
  const [account, setAccount] = useState<Account>(defaultAccount);
  const [orgName, setOrgName] = useState("");
  const [cui, setCui] = useState("");
  const [googlePending, setGooglePending] = useState(false);

  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const signInWithGoogle = async () => {
    setGooglePending(true);
    // Salvăm intenția de firmă înainte de redirect — /auth/callback o citește
    // după ce Google confirmă identitatea (aceeași cheie ca la signup email).
    if (mode === "signup" && account === "B2B" && orgName.trim()) {
      document.cookie = `${PENDING_ORG_COOKIE}=${encodeURIComponent(
        JSON.stringify({ name: orgName.trim(), cui: cui.trim() })
      )}; path=/; max-age=3600; samesite=lax`;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (state?.status === "confirm-email") {
    return (
      <div className="min-h-screen bg-slate-50 flex-1 flex flex-col justify-center py-12 px-4">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
            Verifică-ți email-ul
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Ți-am trimis un link de confirmare. Apasă-l ca să-ți activezi contul —
            apoi te poți conecta.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm font-semibold text-brand hover:underline"
          >
            Înapoi la conectare
          </Link>
        </div>
      </div>
    );
  }

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
          Documentele auto, verificate automat.
          <br />
          Alertate înainte să coste.
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {mode === "signup" && (
            <div className="mb-5">
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Ce fel de cont deschizi?
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    ["B2C", "Persoană fizică", Car],
                    ["B2B", "Firmă", Truck],
                  ] as const
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAccount(id)}
                    className={`min-h-11 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${account === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="space-y-4" action={formAction}>
            {mode === "signup" && <input type="hidden" name="accountType" value={account} />}
            {mode === "login" && (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            )}
            {mode === "signup" && account === "B2B" && (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Input
                    label="Nume firmă"
                    name="orgName"
                    placeholder="TransLog SRL"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <Input
                  label="CUI"
                  name="cui"
                  placeholder="RO12345678"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                />
              </div>
            )}
            <Input label="Email" name="email" type="email" placeholder="nume@email.ro" required />
            <Input
              label="Parolă"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
            />
            {state?.error && (
              <p className="text-sm text-red-600" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" size="sm" className="w-full" disabled={pending}>
              {pending
                ? "Se procesează…"
                : mode === "signup"
                  ? "Creează cont"
                  : "Intră în cont"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-500">sau</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={signInWithGoogle}
            disabled={googlePending}
          >
            <GoogleIcon />
            {mode === "signup" ? "Înscrie-te cu Google" : "Continuă cu Google"}
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          {mode === "signup" ? "Ai deja cont?" : "Nu ai cont încă?"}{" "}
          <Link
            href={mode === "signup" ? "/login" : "/signup"}
            className="font-semibold text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
          >
            {mode === "signup" ? "Autentifică-te" : "Creează unul"}
          </Link>
        </p>
      </div>
    </div>
  );
}
