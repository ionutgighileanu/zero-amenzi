import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { SpaceKind, SubscribableSpace } from "@/lib/subscription";

type Client = SupabaseClient<Database>;
type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];

/**
 * Un spațiu: garajul personal sau o flotă. De la D-019 ambele sunt rânduri
 * reale în `spaces`, nu un obiect hardcodat în frontend plus `organizations`.
 */
export type Space = SubscribableSpace & {
  id: string;
  kind: SpaceKind;
  name: string;
  cui: string | null;
};

export function mapSpaceRow(row: SpaceRow): Space {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    cui: row.cui,
    subscriptionStatus: row.subscription_status,
    trialEndsAt: row.trial_ends_at,
  };
}

/**
 * Ruta unui spațiu.
 *
 * Personal și flotă rămân interfețe separate deliberat — carduri cu semafor
 * pentru B2C, tabel compact pentru B2B (vezi CLAUDE.md). Modelul de date e
 * unificat; prezentarea nu.
 */
export function spacePath(space: Pick<Space, "id" | "kind">): string {
  return space.kind === "personal" ? "/app/garage" : `/app/fleet/${space.id}`;
}

export async function fetchSpace(supabase: Client, spaceId: string): Promise<Space | null> {
  const { data } = await supabase.from("spaces").select("*").eq("id", spaceId).maybeSingle();
  return data ? mapSpaceRow(data) : null;
}

/**
 * Garajul personal al unui user. Creat automat de triggerul de la signup, deci
 * ar trebui să existe mereu — dar întoarcem null în loc să aruncăm, ca un cont
 * vechi fără spațiu (creat înainte de migrare) să nu rupă tot dashboard-ul.
 */
export async function fetchPersonalSpace(supabase: Client, userId: string): Promise<Space | null> {
  const { data } = await supabase
    .from("spaces")
    .select("*")
    .eq("owner_id", userId)
    .eq("kind", "personal")
    .maybeSingle();
  return data ? mapSpaceRow(data) : null;
}

/** Toate spațiile în care userul e membru — pentru comutatorul de context. */
export async function fetchUserSpaces(supabase: Client, userId: string): Promise<Space[]> {
  const { data: memberships } = await supabase
    .from("memberships")
    .select("space_id")
    .eq("user_id", userId);

  const ids = (memberships ?? []).map((m) => m.space_id);
  if (ids.length === 0) return [];

  const { data } = await supabase.from("spaces").select("*").in("id", ids);
  // Personalul primul, apoi flotele alfabetic — ordine stabilă în comutator.
  return (data ?? [])
    .map(mapSpaceRow)
    .sort((a, b) =>
      a.kind === b.kind ? a.name.localeCompare(b.name, "ro") : a.kind === "personal" ? -1 : 1
    );
}
