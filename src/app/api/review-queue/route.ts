import { NextResponse } from "next/server";
import { buildReviewQueue } from "@/lib/mastery/reviewQueue";
import { getVocabularyItems, getGrammarConcepts } from "@/lib/mastery/repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const sessionTargetCount = parseInt(searchParams.get("sessionTargetCount") || "20", 10);

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const vocabulary = await getVocabularyItems(userId);
    const grammar = await getGrammarConcepts();
    const queue = buildReviewQueue(vocabulary, grammar, sessionTargetCount);

    return NextResponse.json({ queue, count: queue.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to build review queue" }, { status: 500 });
  }
}