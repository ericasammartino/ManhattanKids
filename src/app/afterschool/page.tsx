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
  // Default to all Manhattan so programs without a zip in the spreadsheet
  // are not hidden behind the Upper West Side filter on first visit.
  const initialFilters = resolveActivityFilters(params, {
    defaultType: "Afterschool Program",
    defaultNeighborhood: "all",
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
        defaultNeighborhood="all"
        emptyLabel="afterschool programs"
        groupedCards
        initialFilters={initialFilters}
      />
    </Suspense>
  );
}
