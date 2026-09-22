import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_EMAIL } from "@/lib/constants";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/termeni" },
  title: "Termeni și condiții — Zero Amenzi",
  description:
    "Condițiile de folosire a serviciului: acces gratuit, fără garanții, rezultatele verificării au caracter informativ și nu înlocuiesc sursele oficiale.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Termeni și condiții" updatedAt="16 septembrie 2026">
      <LegalSection title="Acceptarea termenilor">
        <p>
          Prin folosirea Zero Amenzi accepți termenii de mai jos. Dacă nu ești de acord cu ei, te
          rugăm să nu folosești serviciul.
        </p>
      </LegalSection>

      <LegalSection title="Ce face serviciul">
        <p>
          Zero Amenzi verifică valabilitatea actelor auto (ITP, RCA, rovinietă) și trimite alerte
          înainte de expirare, pentru mașini personale sau pentru flote.
        </p>
      </LegalSection>

      <LegalSection title="Serviciul este gratuit și oferit „ca atare”">
        <LegalList
          items={[
            "Serviciul este pus la dispoziție gratuit, în forma în care se află la un moment dat.",
            "Nu oferim nicio garanție privind disponibilitatea neîntreruptă, absența erorilor sau păstrarea datelor.",
            "Putem modifica, suspenda sau opri serviciul, integral sau parțial, în orice moment.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Rezultatele au caracter informativ">
        <p>
          <strong>
            Datele afișate nu au valoare juridică și nu înlocuiesc sursele oficiale.
          </strong>{" "}
          Sunt orientative și pot fi incomplete, întârziate sau greșite.
        </p>
        <p>
          Pentru situația oficială a unui document, consultă sursa competentă: RAR pentru ITP,
          baza de date CEDAM pentru RCA, CNAIR pentru rovinietă. Nu ne asumăm răspunderea pentru
          amenzi, pagube sau alte consecințe rezultate din folosirea informațiilor de aici.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilitatea ta">
        <LegalList
          items={[
            "Răspunzi pentru corectitudinea datelor pe care le introduci — numere de înmatriculare, serii de șasiu, date de expirare.",
            "Introduci doar date pe care ai dreptul să le folosești. Nu introduce date despre vehicule sau persoane fără temei.",
            "Nu folosi serviciul automatizat, la scară, sau în moduri care afectează funcționarea lui pentru ceilalți.",
            "Îți păstrezi datele de autentificare în siguranță și răspunzi de activitatea din contul tău.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Alertele nu sunt o garanție">
        <p>
          Alertele prin email și notificările push sunt un ajutor, nu o garanție. Livrarea depinde
          de furnizori externi și de setările dispozitivului tău. Rămâne responsabilitatea ta să
          îți ții actele valabile, indiferent dacă ai primit sau nu o alertă.
        </p>
      </LegalSection>

      <LegalSection title="Datele personale">
        <p>
          Modul în care colectăm și folosim datele este descris în{" "}
          <Link
            href="/politica-confidentialitate"
            className="text-brand font-medium hover:underline"
          >
            politica de confidențialitate
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Întrebări legate de acești termeni:{" "}
          <a href={`mailto:${ADMIN_EMAIL}`} className="text-brand font-medium hover:underline">
            {ADMIN_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Legea aplicabilă">
        <p>
          Acestor termeni li se aplică legea română. Eventualele litigii se soluționează de
          instanțele competente din România.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
