"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  onClose: () => void;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: ReactNode;
};

export function Modal({ onClose, title, subtitle, wide, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-lg" : "max-w-md"} flex flex-col max-h-[85vh]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex justify-between items-start px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Închide"
            className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
