"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Car, Check, ChevronDown, LogOut, Plus, Shield, Truck } from "lucide-react";
import { BRAND_BLUE } from "@/lib/constants";
import { MOCK_ORG } from "@/lib/vehicles";

type Space = {
  id: string;
  name: string;
  kind: string;
  href: string;
  icon: typeof Car;
};

// Mock până la integrarea Supabase Auth: un cont cu garaj personal + o flotă.
const SPACES: Space[] = [
  { id: "personal", name: "Garajul meu", kind: "Persoană fizică", href: "/app/garage", icon: Car },
  { id: MOCK_ORG.id, name: MOCK_ORG.name, kind: "Flotă", href: `/app/fleet/${MOCK_ORG.id}`, icon: Truck },
];

const MOCK_EMAIL = "andrei.popa@gmail.com";

function ContextSwitcher() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const active =
    SPACES.find((s) => s.id !== "personal" && pathname.startsWith(s.href)) ?? SPACES[0];
  const ActiveIcon = active.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ActiveIcon size={15} className="text-slate-500" />
        <span className="text-sm font-semibold text-slate-800 max-w-[9rem] truncate">
          {active.name}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-1.5"
            role="menu"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Spațiile tale
            </p>
            {SPACES.map((s) => {
              const Icon = s.icon;
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
                    <span className="block text-xs text-slate-400">{s.kind}</span>
                  </span>
                  {s.id === active.id && <Check size={16} className="text-blue-700 shrink-0" />}
                </button>
              );
            })}
            <div className="border-t border-slate-100 my-1.5" />
            <button
              role="menuitem"
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-slate-500 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <span className="w-7 h-7 rounded-lg border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                <Plus size={14} />
              </span>
              <span className="text-sm font-medium">Conectează o firmă</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AppHeader({ alertCount = 0 }: { alertCount?: number }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Link
              href="/app"
              className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-lg"
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <Shield className="text-white" size={15} />
              </span>
              <span className="font-extrabold text-lg tracking-tight hidden sm:block font-display">
                AutoDocs
              </span>
            </Link>
            <span className="text-slate-300 hidden sm:block">/</span>
            <ContextSwitcher />
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              className="relative p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              aria-label={`Notificări: ${alertCount} alerte`}
            >
              <Bell size={17} />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
            <span className="text-xs text-slate-400 hidden md:block">{MOCK_EMAIL}</span>
            <Link
              href="/"
              aria-label="Ieși din cont"
              className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
