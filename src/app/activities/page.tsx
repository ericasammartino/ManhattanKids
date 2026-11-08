import { Suspense } from "react";
import { getEnrichedActivities } from "@/lib/data";
import ActivitiesClient from "./ActivitiesClient";

export default function ActivitiesPage() {
  const activities = getEnrichedActivities();
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-8 text-gray-500">Loading activities…</div>}>
      <ActivitiesClient activities={activities} />
    </Suspense>
  );
}
