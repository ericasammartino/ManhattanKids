import { Suspense } from "react";
import { getEnrichedActivities } from "@/lib/data";
import { resolveActivityFilters } from "@/lib/activity-filters";
import ActivitiesClient from "./ActivitiesClient";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ActivitiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const activities = getEnrichedActivities();
  const initialFilters = resolveActivityFilters(params, {
    defaultType: "all",
  });

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 text-muted">
          Loading activities…
        </div>
      }
    >
      <ActivitiesClient
        activities={activities}
        initialFilters={initialFilters}
      />
    </Suspense>
  );
}
