"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
};

/** Toggle on/off pentru preferințe (vezi /app/settings). Buton, nu
 * `<input type="checkbox">` — control complet pe stilizare, cu semantică
 * păstrată prin role="switch" + aria-checked. */
export function Switch({ checked, onChange, disabled, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700 disabled:opacity-50 disabled:pointer-events-none ${
        checked ? "bg-brand" : "bg-slate-300"
      }`}
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
