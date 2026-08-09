import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { AutoRefresh } from "@/components/AutoRefresh";
import { createAdminClient } from "@/lib/supabase/admin";
import { describeResult, type ResultTone } from "@/lib/verification";
import type { Database } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Rezultatul verificării — AutoDocs" };

type VerificationRow = Database["public"]["Tables"]["verification_requests"]["Row"];

export default async function VerificationResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: request } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Nav />
      <section className="pt-16 sm:pt-20 pb-24">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          {!request ? (
            <InvalidState />
          ) : request.status === "pending" ? (
            <PendingState plate={request.plate_number} />
          ) : (
            <CompletedState request={request} />
          )}
        </div>
      </section>
    </div>
  );
}

function InvalidState() {
  return (
    <div className="text-center py-10">
      <h1 className="text-xl font-extrabold tracking-tight font-display">
        Link invalid sau expirat
      </h1>
      <p className="text-sm text-slate-500 mt-2">Fă o verificare nouă.</p>
      <Button href="/verificare" size="sm" className="mt-6">
        Verifică alt număr
      </Button>
    </div>
  );
}

const DOC_LABELS = ["ITP", "RCA", "Rovinietă"] as const;

function PendingState({ plate }: { plate: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
      <AutoRefresh seconds={30} />
      <div className="flex justify-center mb-5">
        <Plate plate={plate} size="lg" />
      </div>
      <div className="text-left">
        {DOC_LABELS.map((label) => (
          <div key={label} className="py-2.5 border-b border-slate-100 last:border-0">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
              {label} · <Loader2 size={13} className="animate-spin text-slate-400" /> Se verifică...
            </span>
          </div>
        ))}
      </div>
      <span className="inline-block mt-4 text-[11px] font-bold uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
        De obicei durează sub 24h
      </span>
      <div className="mt-5">
        <Button href="/signup" variant="outline" size="sm" className="w-full">
          Creează cont pentru alerte automate
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Nu închide tabul — pagina se actualizează automat când e gata.
      </p>
    </div>
  );
}

function CompletedState({ request }: { request: VerificationRow }) {
  const rca = describeResult(request.result_rca, request.result_rca_expires);
  const showBuyRca = rca.tone === "warning" || rca.tone === "expired";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-center mb-5">
        <Plate plate={request.plate_number} size="lg" />
      </div>
      <div>
        <ResultRow label="ITP" result={request.result_itp} expiresAt={request.result_itp_expires} />
        <ResultRow label="RCA" result={request.result_rca} expiresAt={request.result_rca_expires} />
        <ResultRow
          label="Rovinietă"
          result={request.result_rovinieta}
          expiresAt={request.result_rovinieta_expires}
        />
      </div>
      <div className="mt-5 space-y-2">
        <Button href="/signup" size="sm" className="w-full">
          Creează cont gratuit ca să primești alerte cu 30 de zile înainte
        </Button>
        {showBuyRca && (
          <Button href="/signup" variant="outline" size="sm" className="w-full">
            Cumpără RCA acum
          </Button>
        )}
      </div>
    </div>
  );
}

const TONE_CLASS: Record<ResultTone, string> = {
  valid: "text-emerald-700",
  warning: "text-amber-700",
  expired: "text-red-600",
  none: "text-slate-500",
};

function ResultRow({
  label,
  result,
  expiresAt,
}: {
  label: string;
  result: VerificationRow["result_itp"];
  expiresAt: string | null;
}) {
  const { tone, text } = describeResult(result, expiresAt);
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <span className={`text-sm font-semibold ${TONE_CLASS[tone]}`}>
        {label} · {text}
      </span>
    </div>
  );
}
