import { BRAND_BLUE } from "@/lib/constants";

type Size = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, { band: string; text: string; star: string }> = {
  sm: { band: "w-4 text-[7px]", text: "text-[13px] px-2 py-0.5", star: "text-[5px]" },
  md: { band: "w-5 text-[8px]", text: "text-[15px] px-2.5 py-1", star: "text-[6px]" },
  lg: { band: "w-7 text-[10px]", text: "text-xl px-3.5 py-1.5", star: "text-[8px]" },
};

export function Plate({ plate, size = "md" }: { plate: string; size?: Size }) {
  const s = SIZE_CLASSES[size];
  return (
    <span className="inline-flex items-stretch rounded-md overflow-hidden border border-slate-300 shadow-sm select-none shrink-0 font-display">
      <span
        className={`${s.band} flex flex-col items-center justify-center text-white font-bold leading-none gap-0.5`}
        style={{ backgroundColor: BRAND_BLUE }}
      >
        <span className={s.star} aria-hidden>
          ★
        </span>
        <span>RO</span>
      </span>
      <span
        className={`${s.text} bg-white font-extrabold tracking-widest text-slate-900 leading-none flex items-center`}
      >
        {plate}
      </span>
    </span>
  );
}
