import { NextResponse } from "next/server";
import { updateCognitiveProfile } from "@/lib/profile/profileUpdate";
import { getUserProfile, updateUserProfile, getSessionSummaries } from "@/lib/profile/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, session_summary } = body;

    if (!user_id || !session_summary) {
      return NextResponse.json({ error: "Missing user_id or session_summary" }, { status: 400 });
    }

    const profile = await getUserProfile(user_id);
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const summaries = await getSessionSummaries(user_id);
    profile.session_log = summaries;

    const updatedProfile = updateCognitiveProfile(profile, session_summary);
    await updateUserProfile(user_id, updatedProfile);

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}