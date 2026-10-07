import type { Metadata } from "next";
import { ADMIN_EMAIL } from "@/lib/constants";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/politica-confidentialitate" },
  title: "Politica de confidențialitate — Zero Amenzi",
  description:
    "Ce date colectăm (număr de înmatriculare și, opțional, email), cum le folosim, cine le procesează și cum îți exerciți drepturile GDPR.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Politica de confidențialitate" updatedAt="7 octombrie 2026">
      <LegalSection title="Cine suntem">
        <p>
          Zero Amenzi este un serviciu care verifică valabilitatea actelor auto (ITP, RCA,
          rovinietă) și trimite alerte înainte de expirare. Operatorul datelor poate fi contactat
          la{" "}
          <a href={`mailto:${ADMIN_EMAIL}`} className="text-brand font-medium hover:underline">
            {ADMIN_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Ce date colectăm">
        <LegalList
          items={[
            <>
              <strong>Numărul de înmatriculare</strong> — obligatoriu pentru a putea face
              verificarea. Îl introduci tu, în formularul de pe pagina principală.
            </>,
            <>
              <strong>Adresa de email</strong> — opțională la verificarea publică. O ceri doar dacă
              vrei să primești rezultatul pe email. Dacă îți faci cont, emailul devine obligatoriu,
              fiind identificatorul contului.
            </>,
            <>
              <strong>Datele vehiculelor și ale documentelor</strong> — pentru utilizatorii cu
              cont: numere de înmatriculare, serii de șasiu (VIN) și date de expirare, introduse de
              tine. Pentru conturile de firmă, și numele și telefonul șoferilor.
            </>,
            <>
              <strong>Nu colectăm documente de identitate.</strong> Nu îți cerem și nu stocăm
              buletin, permis de conducere sau copii după acte — doar datele de expirare.
            </>,
            <>
              <strong>Date tehnice</strong> — adresa IP și informații despre browser, procesate
              automat când folosești aplicația, pentru securitate (limitarea abuzului și a
              atacurilor automate) și buna funcționare a serviciului.
            </>,
            <>
              <strong>Date pentru notificări push</strong> — dacă le activezi, stocăm
              identificatorul de abonament al browserului tău (endpoint-ul oferit de
              Google/Mozilla/Apple și cheile de criptare), strict ca să îți putem trimite alertele.
              Le ștergem când dezactivezi notificările sau îți ștergi contul.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="De ce le folosim">
        <LegalList
          items={[
            "Ca să efectuăm verificarea pe care ai cerut-o și să îți arătăm rezultatul.",
            "Ca să îți trimitem alerte înainte ca un document să expire — prin email și, dacă ai activat, prin notificări push.",
            "Ca să îți administrăm contul și vehiculele salvate, dacă ți-ai creat unul.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Cine mai are acces la ele">
        <p>
          Folosim servicii externe care procesează date în numele nostru. Nu vindem și nu
          închiriem datele tale nimănui.
        </p>
        <LegalList
          items={[
            <>
              <strong>Supabase</strong> — găzduiește baza de date și sistemul de autentificare.
              Acolo sunt stocate efectiv datele contului, vehiculele și cererile de verificare.
            </>,
            <>
              <strong>Resend</strong> — trimite emailurile de alertă, de confirmare a contului și
              de rezultat al verificării. Primește adresa ta de email și conținutul mesajului.
            </>,
            <>
              <strong>Vercel</strong> — găzduiește aplicația și procesează cererile web.
            </>,
            <>
              <strong>Upstash</strong> — serviciu de limitare a traficului (rate limiting) care
              primește adresa ta IP pentru a bloca abuzul și atacurile automate.
            </>,
            <>
              <strong>Google</strong> — doar dacă alegi „Continuă cu Google&rdquo;: autentificarea
              se face pe serverele Google, care ne confirmă identitatea și ne transmit adresa ta
              de email.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Cookie-uri">
        <p>
          Folosim doar <strong>cookie-uri funcționale</strong>, necesare ca aplicația să meargă:
          cookie-ul de sesiune care te ține autentificat după login și un cookie temporar (o oră)
          care reține intenția de a crea un cont de firmă în timpul înregistrării.
        </p>
        <p>
          Nu folosim cookie-uri de publicitate, de urmărire între site-uri sau de profilare. Nu
          avem instalat niciun instrument de analytics în acest moment.
        </p>
      </LegalSection>

      <LegalSection title="Cât timp le păstrăm">
        <LegalList
          items={[
            "Cererile de verificare publică: păstrate maximum 12 luni, cât să rămână funcțional linkul de rezultat, apoi șterse automat. Poți cere ștergerea lor și mai devreme, oricând.",
            "Datele contului și ale vehiculelor: cât timp contul există. Ștergerea contului le elimină.",
            "Un șofer șters dispare imediat din aplicație și e șters definitiv din baza de date după 30 de zile, împreună cu atestatele lui.",
            "Un vehicul șters dispare imediat din aplicație. După 30 de zile îi ștergem definitiv documentele, cererile de verificare și istoricul alertelor, iar numărul de înmatriculare, seria de șasiu și modelul sunt eliminate. Rămâne doar o evidență anonimă că în cont a existat un vehicul în perioada gratuită, necesară pentru limita de vehicule gratuite.",
            <>
              <strong>Evidența perioadelor gratuite folosite</strong> — păstrăm, chiar și după
              ștergerea vehiculului sau a contului: numărul de înmatriculare și seria de șasiu
              (VIN) ale fiecărui vehicul care a beneficiat de perioada gratuită, plus o amprentă
              criptografică a adresei de email a fiecărui cont (nu adresa în sine — din amprentă
              adresa nu poate fi citită, doar recunoscută dacă e folosită din nou). Nu sunt
              legate de alte date despre tine. Temeiul este interesul nostru legitim de a preveni
              abuzul: fără ele, aceeași persoană sau aceeași mașină ar putea primi perioada
              gratuită la nesfârșit, prin conturi noi.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Vârsta minimă">
        <p>
          Serviciul nu este destinat persoanelor sub 18 ani și nu colectăm cu bună știință date
          despre ele.
        </p>
      </LegalSection>

      <LegalSection title="Drepturile tale (GDPR)">
        <p>
          Conform Regulamentului General privind Protecția Datelor, ai următoarele drepturi:
        </p>
        <LegalList
          items={[
            <>
              <strong>Acces</strong> — să afli ce date avem despre tine și să primești o copie.
            </>,
            <>
              <strong>Rectificare</strong> — să corectezi datele greșite sau incomplete.
            </>,
            <>
              <strong>Ștergere</strong> („dreptul de a fi uitat&rdquo;) — să ceri eliminarea
              datelor tale, când nu mai avem un motiv legitim să le păstrăm.
            </>,
            <>
              <strong>Portabilitate</strong> — să primești datele într-un format structurat, care
              poate fi citit automat, și să le transferi altui operator.
            </>,
            <>
              <strong>Restricționare și opoziție</strong> — să ceri limitarea prelucrării sau să te
              opui acesteia.
            </>,
          ]}
        />
        <p>
          Pentru oricare dintre ele, scrie-ne la{" "}
          <a href={`mailto:${ADMIN_EMAIL}`} className="text-brand font-medium hover:underline">
            {ADMIN_EMAIL}
          </a>
          . Ai de asemenea dreptul să depui o plângere la Autoritatea Națională de Supraveghere a
          Prelucrării Datelor cu Caracter Personal (ANSPDCP).
        </p>
      </LegalSection>

      <LegalSection title="Securitate">
        <p>
          Accesul la date este restricționat la nivel de bază de date, astfel încât fiecare cont să
          poată citi și modifica doar propriile rânduri. Comunicarea cu aplicația se face criptat
          (HTTPS).
        </p>
      </LegalSection>

      <LegalSection title="Modificări">
        <p>
          Dacă schimbăm această politică, actualizăm data de la începutul paginii. Pentru
          modificări importante, anunțăm utilizatorii cu cont prin email.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
