/**
 * Date structurate (schema.org), pentru Google și pentru motoarele bazate pe
 * modele de limbaj.
 *
 * `<` e escapat: fără asta, un text care conține „</script>" ar închide tagul
 * și ar injecta HTML în pagină. Conținutul vine azi din constantele noastre,
 * dar regula rămâne, fiindcă mâine poate veni din baza de date.
 *
 * Randat pe server, inline. Trece de CSP fiindcă politica are deja
 * 'unsafe-inline' pe script-src (vezi D-021).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
