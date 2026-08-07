import type { Metadata } from "next";
import { NewOrganizationForm } from "@/components/app/NewOrganizationForm";

export const metadata: Metadata = {
  title: "Conectează o firmă — AutoDocs",
};

export default function NewOrganizationPage() {
  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-xl font-extrabold tracking-tight font-display">
        Conectează o firmă
      </h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Devii automat administrator. Poți invita colegi și adăuga vehicule imediat după.
      </p>
      <NewOrganizationForm />
    </main>
  );
}
