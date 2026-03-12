"use client";

import { useEffect } from "react";
import { FamilyDashboard } from "@/components/family-dashboard";
import { generateDemoChildren, generateDemoSnapshots } from "@/lib/demo-data";

const demoChildren = generateDemoChildren();

export default function FamilyDemoPage() {
  // Seed demo snapshot history into localStorage
  useEffect(() => {
    generateDemoSnapshots();
  }, []);

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <p className="text-[12px] font-medium text-amber-800">
            Demo mode — showing sample data
          </p>
        </div>
      </div>
      <FamilyDashboard children={demoChildren} fetchedAt={new Date()} />
    </>
  );
}
