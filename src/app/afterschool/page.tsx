import { Suspense } from "react";
import { getAfterschoolPrograms } from "@/lib/data";
import ActivitiesClient from "../activities/ActivitiesClient";

export default function AfterschoolPage() {
  const programs = getAfterschoolPrograms();
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
      />
    </Suspense>
  );
}
