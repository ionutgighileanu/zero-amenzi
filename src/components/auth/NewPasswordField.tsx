"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PASSWORD_RULES } from "@/lib/password";

type NewPasswordFieldProps = {
  label?: string;
  name?: string;
};

/** Câmp pentru o parolă nouă, cu cerințele bifate live pe măsură ce omul scrie. */
export function NewPasswordField({ label = "Parolă", name = "password" }: NewPasswordFieldProps) {
  const [password, setPassword] = useState("");

  return (
    <div>
      <Input
        label={label}
        name={name}
        type="password"
        placeholder="••••••••••"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-describedby="cerinte-parola"
      />
      <ul id="cerinte-parola" className="mt-2 space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-2 text-xs ${met ? "text-emerald-700" : "text-slate-500"}`}
            >
              {met ? (
                <Check size={14} className="shrink-0" aria-hidden />
              ) : (
                <Circle size={14} className="shrink-0" aria-hidden />
              )}
              <span>
                {rule.label}
                <span className="sr-only">{met ? " — îndeplinit" : " — lipsește"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
