import { AppHeader } from "@/components/app/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex-1">
      <AppHeader />
      {children}
    </div>
  );
}
