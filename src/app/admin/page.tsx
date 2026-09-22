import { redirect } from "next/navigation";

/** /admin nu are conținut propriu: intră direct în coada de lucru. */
export default function AdminIndexPage() {
  redirect("/admin/verifications");
}
