"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Shield className="text-white" size={17} aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight font-display">
            AutoDocs
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="text-slate-600 hover:text-slate-900">
              {label}
            </a>
          ))}
          <Button variant="outline" size="sm" href="/login">
            Conectare
          </Button>
          <Button variant="primary" size="sm" href="/signup">
            Creează cont
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Meniu"
        >
          {mobileMenu ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
      {mobileMenu && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
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
            <Button variant="outline" size="sm" className="flex-1" href="/login">
              Conectare
            </Button>
            <Button variant="primary" size="sm" className="flex-1" href="/signup">
              Creează cont
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
