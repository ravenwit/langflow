import { NextResponse } from "next/server";
import { isItemIntroducible, IntroductionGateContext } from "@/lib/mastery/introductionGate";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateCefr, prerequisiteMasteryScores } = body;
    const context: IntroductionGateContext = {
      userMonthPhase: body.userMonthPhase,
      cognitiveLoadIndex: body.cognitiveLoadIndex ?? 0,
      newItemsIntroducedThisSession: body.newItemsIntroducedThisSession ?? 0,
    };

    if (candidateCefr === undefined || !Array.isArray(prerequisiteMasteryScores)) {
      return NextResponse.json({ error: "Missing candidateCefr or prerequisiteMasteryScores" }, { status: 400 });
    }

    const result = isItemIntroducible(candidateCefr, prerequisiteMasteryScores, context);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}