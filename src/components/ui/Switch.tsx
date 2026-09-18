"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Comutatorul e deja în poziția nouă, dar operația din spate încă rulează:
   * arată un spinner în bilă și blochează un al doilea click, fără să
   * estompeze controlul ca la `disabled` (nu e indisponibil, e în lucru). */
  busy?: boolean;
  label: string;
};

/** Toggle on/off pentru preferințe (vezi /app/settings). Buton, nu
 * `<input type="checkbox">` — control complet pe stilizare, cu semantică
 * păstrată prin role="switch" + aria-checked. */
export function Switch({ checked, onChange, disabled, busy, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700 ${
        checked ? "bg-brand" : "bg-slate-300"
      } ${busy ? "cursor-progress" : "disabled:opacity-50 disabled:pointer-events-none"}`}
    >
      <span
        aria-hidden
        className={`inline-flex h-5 w-5 items-center justify-center transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {busy && (
          <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-200 border-t-brand animate-spin" />
        )}
      </span>
    </button>
  );
}
