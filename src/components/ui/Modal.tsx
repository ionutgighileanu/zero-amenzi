"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { DURATION, EASE_OUT } from "@/lib/motion";

// Stivă la nivel de modul: Escape închide doar modalul de deasupra,
// nu toate modalele suprapuse (ex. RCA deschis peste Detalii vehicul).
const openModals: symbol[] = [];

type ModalProps = {
  onClose: () => void;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: ReactNode;
};

export function Modal({ onClose, title, subtitle, wide, children }: ModalProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const token = Symbol("modal");
    openModals.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openModals[openModals.length - 1] === token) {
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      openModals.splice(openModals.indexOf(token), 1);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.state, ease: "easeOut" }}
    >
      <motion.div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-lg" : "max-w-md"} flex flex-col max-h-[85vh]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION.enter, ease: EASE_OUT }}
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
      </motion.div>
    </motion.div>
  );
}
