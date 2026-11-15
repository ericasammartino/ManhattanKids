import { Suspense } from "react";
import { getEnrichedActivities } from "@/lib/data";
import ActivitiesClient from "./ActivitiesClient";

export default function ActivitiesPage() {
  const activities = getEnrichedActivities();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 text-muted">
          Loading activities…
        </div>
      }
    >
      <ActivitiesClient activities={activities} />
    </Suspense>
  );
}
