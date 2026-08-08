import { NextResponse } from "next/server";
import { buildFeedback, deliverFeedback } from "@/lib/feedback/builder";
import { FeedbackRequest, FeedbackResponse } from "@/lib/feedback/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackRequest;

    const { action, performance } = body;

    if (!action || !performance) {
      return NextResponse.json({ error: "action and performance are required" }, { status: 400 });
    }

    if (action === "BUILD" || action === "DELIVER") {
      const feedback = buildFeedback(performance, body.turn_text_de);
      const result = deliverFeedback(feedback);

      const response: FeedbackResponse = {
        feedback,
        delivered: result.delivered,
      };

      return NextResponse.json(response);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("Feedback operation failed:", error);
    return NextResponse.json({ error: "Feedback operation failed" }, { status: 500 });
  }
}