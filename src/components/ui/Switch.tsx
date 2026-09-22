"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Comutatorul e deja în poziția nouă, dar operația din spate încă rulează:
   * blochează un al doilea click (care ar porni o operație concurentă), fără
   * să estompeze controlul ca la `disabled` — nu e indisponibil, e în lucru.
   * Deliberat fără indicator vizual: slider-ul mutat e deja feedback-ul. */
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
      } ${busy ? "" : "disabled:opacity-50 disabled:pointer-events-none"}`}
    >
      <span
        aria-hidden
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
