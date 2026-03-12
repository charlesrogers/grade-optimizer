"use client";

import { generateDemoSnapshots } from "./demo-data";

const DEMO_KEY = "demo-mode";

export function isDemoMode(): boolean {
  try {
    return sessionStorage.getItem(DEMO_KEY) === "true";
  } catch {
    return false;
  }
}

export function enableDemoMode(): void {
  sessionStorage.setItem(DEMO_KEY, "true");
  sessionStorage.setItem(
    "observees",
    JSON.stringify([
      { id: "demo-sam", name: "Sam", source: "canvas" },
      { id: "demo-alex", name: "Alex", source: "canvas" },
      { id: "demo-jordan", name: "Jordan", source: "canvas" },
    ])
  );
  generateDemoSnapshots();
}

export function disableDemoMode(): void {
  sessionStorage.removeItem(DEMO_KEY);
  sessionStorage.removeItem("observees");
}
