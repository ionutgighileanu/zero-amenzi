/** O alertă necitită afișată în clopoțelul din header — rezultatul mapării
 * unui rând notifications_log (read_at IS NULL) + eticheta subiectului
 * (plăcuță sau nume șofer). Lista conține doar necitite prin construcție;
 * marcarea „citit" scoate elementul din listă, nu îl bifează vizual. */
export type NotificationItem = {
  id: string;
  docType: string;
  subjectLabel: string;
  daysBefore: number;
  expiresAt: string;
  /** Link spre garaj sau spre flota căreia îi aparține alerta. */
  href: string;
};

export function notificationMessage(n: Pick<NotificationItem, "docType" | "daysBefore">): string {
  if (n.daysBefore === 0) return `${n.docType} expiră azi`;
  return `${n.docType} expiră în ${n.daysBefore} ${n.daysBefore === 1 ? "zi" : "zile"}`;
}
