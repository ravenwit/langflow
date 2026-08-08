import { NextResponse } from "next/server";
import { CognitiveLoadInput, CognitiveLoadResult } from "@/lib/cognitiveLoad/types";
import { calculateCognitiveLoadIndex } from "@/lib/cognitiveLoad/calculator";
import { respondToCognitiveLoad } from "@/lib/cognitiveLoad/responseActions";
import { ScaffoldingConfig } from "@/lib/scenario/types";

export interface CognitiveLoadRequest {
  input: CognitiveLoadInput;
  current_scaffolding: ScaffoldingConfig;
}

export interface CognitiveLoadResponse {
  result: CognitiveLoadResult;
  response: {
    load_level: string;
    actions: Record<string, unknown>;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CognitiveLoadRequest;

    const { input, current_scaffolding } = body;

    if (!input || !current_scaffolding) {
      return NextResponse.json({ error: "input and current_scaffolding are required" }, { status: 400 });
    }

    const result = calculateCognitiveLoadIndex(input);
    const response = respondToCognitiveLoad(result, current_scaffolding);

    return NextResponse.json({ result, response } as CognitiveLoadResponse);
  } catch (error) {
    console.error("Cognitive load calculation failed:", error);
    return NextResponse.json({ error: "Cognitive load calculation failed" }, { status: 500 });
  }
}