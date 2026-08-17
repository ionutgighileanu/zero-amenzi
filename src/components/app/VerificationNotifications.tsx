"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { markInAppNotificationReadAction } from "@/lib/actions/inAppNotifications";
import type { Database } from "@/lib/supabase/database.types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

/**
 * Notificările in-app necitite din tabela `notifications` — azi doar
 * „verificare finalizată". Afișate ca bandă în capul paginilor /app, nu în
 * clopoțel: clopoțelul (NotificationBell) servește notifications_log, care
 * are altă formă (document + zile până la expirare).
 */
export function VerificationNotifications({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState(initial);

  if (items.length === 0) return null;

  const dismiss = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    markInAppNotificationReadAction(id).catch(console.error);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-2">
      <AnimatePresence initial={false}>
        {items.map((n) => (
          <motion.div
            key={n.id}
            layout="position"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.state, ease: EASE_OUT }}
            className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl shadow-sm p-4"
          >
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{n.title}</p>
              <p className="text-sm text-slate-600 mt-0.5">{n.body}</p>
              <Link
                href={n.href}
                onClick={() => dismiss(n.id)}
                className="inline-block mt-1.5 text-sm font-semibold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
              >
                Vezi rezultatul
              </Link>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              aria-label="Închide notificarea"
              className="p-1.5 -mr-1.5 -mt-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
