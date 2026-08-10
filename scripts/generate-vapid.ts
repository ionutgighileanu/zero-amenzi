// Rulează o singură dată (npx ts-node scripts/generate-vapid.ts) — generează
// o pereche de chei VAPID pentru Web Push. NU face parte din pipeline-ul de
// build normal și nu scrie nimic pe disc: cheile se copiază manual în
// .env.local (dev) și în Vercel → Project Settings → Environment Variables
// (producție). Rulează din nou doar dacă vrei să rotești cheile — orice
// subscription existent din push_subscriptions devine invalid și trebuie
// resubscris de client.
import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log("\nChei VAPID generate — copiază-le în .env.local și în Vercel:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}\n`);
