import { AppHeader } from "@/components/app/AppHeader";
import { MotionProvider } from "@/components/MotionProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex-1">
        <AppHeader />
        {children}
      </div>
    </MotionProvider>
  );
}
