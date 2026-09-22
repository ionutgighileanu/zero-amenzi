"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Users } from "lucide-react";

const TABS = [
  { href: "/admin/verifications", label: "Cereri de verificare", icon: ClipboardList },
  { href: "/admin/users", label: "Utilizatori", icon: Users },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-slate-200 mb-6" aria-label="Secțiuni admin">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-t ${
              active
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon size={15} aria-hidden /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
