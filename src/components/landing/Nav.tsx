"use client";

import { useState } from "react";
import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BRAND_BLUE } from "@/lib/constants";

const LINKS: [string, string][] = [
  ["#cum-functioneaza", "Cum funcționează"],
  ["#verificari", "Verificări"],
  ["#tarife", "Tarife"],
  ["#faq", "Întrebări"],
];

export function Nav() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex justify-between items-center h-14">
        <a href="#" className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            <Shield className="text-white" size={17} />
          </span>
          <span className="text-lg font-extrabold tracking-tight font-display">
            AutoDocs
          </span>
        </a>

        <div className="hidden sm:flex items-center gap-6 text-sm">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="text-slate-600 hover:text-slate-900">
              {label}
            </a>
          ))}
          <Button variant="outline" size="sm">
            Conectare
          </Button>
          <Button variant="primary" size="sm">
            Creează cont
          </Button>
        </div>

        <button
          className="sm:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Meniu"
        >
          {mobileMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileMenu && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
          {LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileMenu(false)}
              className="block text-sm font-medium text-slate-700"
            >
              {label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              Conectare
            </Button>
            <Button variant="primary" size="sm" className="flex-1">
              Creează cont
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
