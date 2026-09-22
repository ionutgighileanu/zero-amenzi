"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/faq";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center gap-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
      >
        <span className="text-sm sm:text-base font-semibold text-slate-900">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="text-sm text-slate-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export function Faq() {
  return (
    <div className="mt-8">
      {FAQ_ITEMS.map(({ question, answer }) => (
        <FaqItem key={question} q={question} a={answer} />
      ))}
    </div>
  );
}
