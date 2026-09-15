import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Rate limiting pe acțiunile expuse public (F-02).
 *
 * Starea stă în Upstash Redis, nu în memoria procesului: pe Vercel fiecare
 * request poate nimeri altă instanță de funcție, deci un contor local n-ar
 * limita nimic în practică.
 *
 * DEGRADARE: fără UPSTASH_REDIS_REST_URL și UPSTASH_REDIS_REST_TOKEN,
 * limitarea e INACTIVĂ și cererile trec. Asta ține dev-ul local funcțional
 * fără cont Upstash, dar înseamnă că în producție variabilele sunt
 * obligatorii — altfel ai protecția doar pe hârtie. De-aia avertismentul se
 * scrie o dată per proces, explicit, în loc să eșueze tăcut.
 */

let redis: Redis | null = null;
let warned = false;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!warned) {
      warned = true;
      console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_URL / _TOKEN nesetate — rate limiting INACTIV. " +
          "În producție asta lasă /login, /signup și verificarea publică fără protecție."
      );
    }
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

function makeLimiter(tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1], prefix: string) {
  let instance: Ratelimit | null = null;
  return () => {
    const client = getRedis();
    if (!client) return null;
    instance ??= new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `za:${prefix}`,
      analytics: false,
    });
    return instance;
  };
}

/**
 * Verificarea publică: 4 cereri/oră. Strict pentru că fiecare cerere costă
 * muncă manuală de la admin, iar rezultatul nu e ceva ce ceri de zeci de ori.
 */
const verificationLimiter = makeLimiter(4, "1 h", "verificare");

/**
 * Login: 10 încercări/10 minute. Suficient pentru greșeli de tastare și
 * manager de parole confuz, prea puțin pentru forță brută. Deliberat mai
 * permisiv decât signup-ul: un utilizator legitim chiar reîncearcă la login.
 */
const loginLimiter = makeLimiter(10, "10 m", "login");

/**
 * Signup: 5 conturi/oră. Nimeni legitim nu deschide mai multe într-o oră, iar
 * fiecare înscriere declanșează un email de confirmare din cota Resend.
 */
const signupLimiter = makeLimiter(5, "1 h", "signup");

/**
 * IP-ul clientului din headerele de proxy. Pe Vercel, `x-forwarded-for` e
 * setat de platformă și primul element e IP-ul real al clientului.
 *
 * Atenție: mulți utilizatori din România sunt în spatele CGNAT la operatorii
 * mobili, deci pot împărți un IP. De-aia pragurile de mai sus nu sunt agresive.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "ip-necunoscut";
}

type LimitResult = { allowed: boolean; retryAfterSeconds: number };

async function check(getLimiter: () => Ratelimit | null, key: string): Promise<LimitResult> {
  const limiter = getLimiter();
  if (!limiter) return { allowed: true, retryAfterSeconds: 0 };

  try {
    const { success, reset } = await limiter.limit(key);
    return {
      allowed: success,
      retryAfterSeconds: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (err) {
    // Redis căzut nu trebuie să blocheze autentificarea întregii aplicații.
    console.error("[ratelimit] verificarea a eșuat, las cererea să treacă:", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export async function limitVerification(ip: string) {
  return check(verificationLimiter, ip);
}

export async function limitLogin(ip: string) {
  return check(loginLimiter, ip);
}

export async function limitSignup(ip: string) {
  return check(signupLimiter, ip);
}

/** Mesaj de așteptare în română, din secunde. */
export function retryMessage(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.ceil(seconds / 3600);
    return `Prea multe încercări. Reîncearcă peste ${hours} ${hours === 1 ? "oră" : "ore"}.`;
  }
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Prea multe încercări. Reîncearcă peste ${minutes} ${minutes === 1 ? "minut" : "minute"}.`;
}
