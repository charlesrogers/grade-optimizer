import { NextResponse } from "next/server";
import { clearLMSConfig } from "@/lib/cookies";

export async function POST() {
  await clearLMSConfig();
  return NextResponse.json({ success: true });
}
