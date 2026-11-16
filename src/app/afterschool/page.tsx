import { Suspense } from "react";
import { getAfterschoolPrograms } from "@/lib/data";
import { resolveActivityFilters } from "@/lib/activity-filters";
import ActivitiesClient from "../activities/ActivitiesClient";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AfterschoolPage({ searchParams }: Props) {
  const params = await searchParams;
  const programs = getAfterschoolPrograms();
  const initialFilters = resolveActivityFilters(params, {
    defaultType: "Afterschool Program",
  });

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 text-muted">
          Loading afterschool programs…
        </div>
      }
    >
      <ActivitiesClient
        activities={programs}
        title="Afterschool Programs"
        subtitle="Loaded from Manual Entry Session — enrichment classes, sports, STEM, arts, and more on the UWS."
        defaultType="Afterschool Program"
        emptyLabel="afterschool programs"
        initialFilters={initialFilters}
      />
    </Suspense>
  );
}
