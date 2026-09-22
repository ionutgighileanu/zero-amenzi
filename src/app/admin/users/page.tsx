import type { Metadata } from "next";
import { UsersAdminTable } from "@/components/admin/UsersAdminTable";
import { fetchAdminUsers } from "@/lib/admin/users";

export const metadata: Metadata = {
  title: "Utilizatori — Admin",
  description: "Panou intern: conturile din aplicație, cu spațiile, vehiculele și alertele lor.",
};

export default async function AdminUsersPage() {
  const users = await fetchAdminUsers();
  return <UsersAdminTable users={users} />;
}
