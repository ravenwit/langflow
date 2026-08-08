import { NextResponse } from "next/server";
import { runOnboardingIntake } from "@/lib/profile/onboarding";
import { createUserProfile } from "@/lib/profile/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, raw_interests, daily_contexts, calibration_latencies_ms, microphone_consent, native_language } = body;

    if (!user_id || !Array.isArray(raw_interests) || !Array.isArray(daily_contexts) || !Array.isArray(calibration_latencies_ms)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = runOnboardingIntake({
      user_id,
      raw_interests,
      daily_contexts,
      calibration_latencies_ms,
      microphone_consent: Boolean(microphone_consent),
      native_language,
    });

    const profile = await createUserProfile(result.profile);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}