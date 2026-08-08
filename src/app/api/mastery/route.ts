import { NextResponse } from "next/server";
import { calculateMasteryScore } from "@/lib/mastery/masteryScore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exposure_count, correct_production_count, last_reviewed, error_log } = body;

    const score = calculateMasteryScore({
      exposure_count,
      correct_production_count,
      last_reviewed,
      error_log,
    });

    return NextResponse.json({ mastery_score: score });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}