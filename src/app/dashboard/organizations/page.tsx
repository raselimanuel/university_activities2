import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import { getOrganizationsList } from "@/app/actions/activities";
import OrganizationsClient from "./OrganizationsClient";

export default async function OrganizationsPage() {
  const session = await getCurrentUser();

  if (!session || !session.auth || !session.profile) {
    redirect("/login");
  }

  const result = await getOrganizationsList();

  return <OrganizationsClient initialOrganizations={result.success ? result.organizations : []} />;
}
