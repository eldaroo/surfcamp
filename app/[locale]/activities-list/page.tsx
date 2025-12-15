"use client";

import ActivitiesList from "@/components/ActivitiesList";

export default function ActivitiesListPage() {
  return (
    <div className="min-h-screen bg-slate-900/40 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <ActivitiesList />
      </div>
    </div>
  );
}
