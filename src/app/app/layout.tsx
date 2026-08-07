import { redirect } from "next/navigation";
import { AppHeader, type Space } from "@/components/app/AppHeader";
import { MotionProvider } from "@/components/MotionProvider";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  // Middleware protejează /app/*, dar rămâne o barieră de siguranță aici.
  if (!auth.user) redirect("/login");

  // Interogări separate (nu embedded select) — tipurile Database sunt scrise
  // manual, fără metadata de Relationships necesară inferenței pe join-uri.
  const { data: memberships } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", auth.user.id);

  const orgIds = (memberships ?? []).map((m) => m.org_id);
  const { data: orgs } = orgIds.length
    ? await supabase.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] };

  const orgSpaces: Space[] = (orgs ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    kind: "Flotă",
    href: `/app/fleet/${org.id}`,
  }));

  return (
    <MotionProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex-1">
        <AppHeader email={auth.user.email ?? ""} orgSpaces={orgSpaces} />
        {children}
      </div>
    </MotionProvider>
  );
}
