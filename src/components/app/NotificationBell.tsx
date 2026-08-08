"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { formatDate } from "@/lib/status";
import { notificationMessage, type NotificationItem } from "@/lib/notifications";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";

/** Lista conține doar notificări necitite (read_at IS NULL la interogare) —
 * marcarea „citit" scoate elementul din listă în loc să-l bifeze vizual. */
export function NotificationBell({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  const [items, setItems] = useState(initialNotifications);
  const [open, setOpen] = useState(false);

  const markRead = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    markNotificationReadAction(id).catch(console.error);
  };

  const markAllRead = () => {
    const ids = items.map((n) => n.id);
    if (ids.length === 0) return;
    setItems([]);
    markAllNotificationsReadAction(ids).catch(console.error);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative min-h-11 min-w-11 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        aria-label={`Notificări: ${items.length} necitite`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell size={17} />
        {items.length > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500" aria-hidden />
        )}
      </button>
      {open && (
        <button
          className="fixed inset-0 z-40 cursor-default"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -2 }}
            transition={{ duration: DURATION.state, ease: EASE_OUT }}
            className="absolute right-0 origin-top-right mt-1.5 w-80 max-h-[70vh] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-lg z-50"
            role="menu"
          >
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-100 sticky top-0 bg-white">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Notificări
              </span>
              {items.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
                >
                  Marchează toate ca citite
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-3.5 py-8 text-center text-sm text-slate-500">
                Nicio notificare nouă.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      role="menuitem"
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className="block px-3.5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 bg-blue-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700 mt-1.5 shrink-0" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{n.subjectLabel}</p>
                          <p className="text-sm text-slate-600">{notificationMessage(n)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatDate(n.expiresAt)}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
