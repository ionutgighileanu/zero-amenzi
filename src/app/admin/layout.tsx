import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  // Panoul intern n-are ce căuta în Google.
  robots: { index: false, follow: false },
};

/** Garda + navigația comune tuturor paginilor de admin. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
      <AdminTabs />
      {children}
    </div>
  );
}
