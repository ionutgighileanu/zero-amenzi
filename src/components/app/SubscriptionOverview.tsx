import Link from "next/link";
import { Plate } from "@/components/ui/Plate";
import { formatDate } from "@/lib/status";
import { spacePath, type Space } from "@/lib/spaces";
import {
  isTrialActive,
  TRIAL_VEHICLE_LIMIT,
  vehicleAccess,
  VEHICLE_PRICE_RON_PER_YEAR,
} from "@/lib/subscription";

export type OverviewVehicle = { id: string; spaceId: string; plate: string; paidUntil: string | null };

type SubscriptionOverviewProps = {
  spaces: Space[];
  vehicles: OverviewVehicle[];
};

function spaceStatus(space: Space): { label: string; tone: string } {
  if (isTrialActive(space)) {
    return {
      label: `Perioadă gratuită până la ${formatDate(space.trialEndsAt)}`,
      tone: "text-slate-600",
    };
  }
  if (space.subscriptionStatus === "active") return { label: "Premium", tone: "text-brand" };
  return { label: "Perioada gratuită a expirat", tone: "text-red-700" };
}

/**
 * Starea abonamentului, per spațiu și per vehicul — citită din aceleași reguli
 * care decid accesul pe carduri (src/lib/subscription.ts), deci ce scrie aici
 * nu poate diverge de ce vede omul în garaj.
 *
 * Nu e un istoric de plăți: nu există tabel de plăți și nici procesator
 * conectat. Arată doar starea curentă.
 */
export function SubscriptionOverview({ spaces, vehicles }: SubscriptionOverviewProps) {
  return (
    <div className="space-y-3">
      {spaces.map((space) => {
        const status = spaceStatus(space);
        const own = vehicles.filter((v) => v.spaceId === space.id);
        return (
          <div key={space.id} className="bg-white border border-slate-200 rounded-2xl">
            <div className="p-4 flex items-start justify-between gap-3 border-b border-slate-100">
              <div className="min-w-0">
                <Link
                  href={spacePath(space)}
                  className="text-sm font-semibold text-slate-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
                >
                  {space.name}
                </Link>
                <p className={`text-xs mt-0.5 ${status.tone}`}>{status.label}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 shrink-0 mt-0.5">
                {space.kind === "personal" ? "Personal" : "Flotă"}
              </span>
            </div>

            {own.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Niciun vehicul încă.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {own.map((v) => {
                  const access = vehicleAccess(space, v.paidUntil);
                  return (
                    <li key={v.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <Plate plate={v.plate} size="sm" />
                      <span
                        className={`text-xs text-right ${access === "paid" ? "text-brand font-medium" : access === "locked" ? "text-red-700 font-medium" : "text-slate-500"}`}
                      >
                        {access === "paid"
                          ? `Premium până la ${formatDate(v.paidUntil)}`
                          : access === "trial"
                            ? "Inclus în perioada gratuită"
                            : "Blocat — necesită Premium"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      <p className="text-xs text-slate-500">
        Perioada gratuită acoperă {TRIAL_VEHICLE_LIMIT} vehicul pe spațiu. Premium costă{" "}
        {VEHICLE_PRICE_RON_PER_YEAR} lei pe an per vehicul. Plata online vine în curând.
      </p>
    </div>
  );
}
