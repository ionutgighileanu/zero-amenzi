"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Car, Check, ChevronDown, LogOut, Plus, Settings, Shield, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { signOutAction } from "@/lib/actions/auth";
import { NotificationBell } from "@/components/app/NotificationBell";
import type { NotificationItem } from "@/lib/notifications";

export type Space = {
  id: string;
  name: string;
  /** Tipul real din DB, nu o etichetă de afișare: componenta are nevoie de el
   * ca să aleagă icoana și să distingă garajul de flote. Eticheta vizibilă se
   * derivă din el (vezi SPACE_KIND_LABEL). */
  kind: "personal" | "fleet";
  href: string;
};

const SPACE_KIND_LABEL: Record<Space["kind"], string> = {
  personal: "Persoană fizică",
  fleet: "Flotă",
};

// Garajul personal nu mai e hardcodat aici (D-019): vine din DB, ca orice alt
// spațiu, prin prop-ul `spaces`.

function ContextSwitcher({ spaces }: { spaces: Space[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Flota activă se recunoaște după rută; dacă nicio flotă nu se potrivește,
  // suntem în garajul personal, care e mereu primul din listă.
  const active = spaces.find((s) => s.kind === "fleet" && pathname.startsWith(s.href)) ?? spaces[0];
  const ActiveIcon = active?.kind === "personal" ? Car : Truck;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="min-h-11 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ActiveIcon size={15} className="text-slate-500" />
        <span className="text-sm font-semibold text-slate-800 max-w-36 truncate">
          {active.name}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
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
            className="absolute left-0 origin-top-left mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-1.5"
            role="menu"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Spațiile tale
            </p>
            {spaces.map((s) => {
              const Icon = s.kind === "personal" ? Car : Truck;
              return (
                <button
                  key={s.id}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    router.push(s.href);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                >
                  <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-slate-600" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800 truncate">
                      {s.name}
                    </span>
                    <span className="block text-xs text-slate-500">{SPACE_KIND_LABEL[s.kind]}</span>
                  </span>
                  {s.id === active.id && <Check size={16} className="text-blue-700 shrink-0" />}
                </button>
              );
            })}
            <div className="border-t border-slate-100 my-1.5" />
            <Link
              href="/app/organizations/new"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-slate-500 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <span className="w-7 h-7 rounded-lg border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                <Plus size={14} />
              </span>
              <span className="text-sm font-medium">Conectează o firmă</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type AppHeaderProps = {
  email: string;
  spaces: Space[];
  notifications: NotificationItem[];
};

export function AppHeader({ email, spaces, notifications }: AppHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Link
              href="/app"
              className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-lg"
            >
              <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
                <Shield className="text-white" size={15} />
              </span>
              <span className="font-extrabold text-lg tracking-tight hidden sm:block font-display">
                AutoDocs
              </span>
            </Link>
            <span className="text-slate-300 hidden sm:block">/</span>
            <ContextSwitcher spaces={spaces} />
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <NotificationBell initialNotifications={notifications} />
            <Link
              href="/app/settings"
              aria-label="Preferințe alerte"
              className="min-h-11 min-w-11 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <Settings size={17} />
            </Link>
            <span className="text-xs text-slate-500 hidden md:block">{email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Ieși din cont"
                className="min-h-11 min-w-11 inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
