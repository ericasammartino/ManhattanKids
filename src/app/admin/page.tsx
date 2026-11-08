import { getIncomingActivities, getEnrichedActivities, getOrganizations } from "@/lib/data";
import AdminClient from "./AdminClient";

export default function AdminPage() {
  const incoming = getIncomingActivities();
  const activities = getEnrichedActivities();
  const organizations = getOrganizations();

  const stats = {
    total: activities.length,
    pending: incoming.filter((i) => i["Review Status"] === "Pending Review").length,
    approved: incoming.filter((i) => i["Review Status"] === "Approved").length,
    organizations: organizations.length,
  };

  return <AdminClient incoming={incoming} stats={stats} activities={activities} />;
}
