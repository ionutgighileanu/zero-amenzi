import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/**
 * Sitemap pentru paginile publice.
 *
 * Intră doar ce poate fi indexat: landing, verificarea publică, autentificarea
 * și paginile legale. Rămân afară /app/*, /admin/* și /api/* (necesită sesiune
 * sau n-au conținut de indexat), plus paginile cu identificator în URL —
 * /verificare/[token] și /verificare/status/[id] sunt „capability URL"-uri,
 * neghicibile prin construcție, iar listarea lor ar anula exact proprietatea
 * care le ține private.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/verificare`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${SITE_URL}/politica-confidentialitate`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: `${SITE_URL}/termeni`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
