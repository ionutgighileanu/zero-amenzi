"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { StatusCell } from "@/components/app/StatusCell";

type DocLineProps = {
  label: string;
  date: string | null | undefined;
  onDelete?: () => void;
  action?: ReactNode;
};

export function DocLine({ label, date, onDelete, action }: DocLineProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-1.5">
        <StatusCell date={date} />
        {action}
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label={`Șterge ${label}`}
            className="p-1 text-slate-300 hover:text-red-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
