import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { premiumAllowed, incrementUsage } from "@/lib/usage";
import { logAction } from "@/lib/logs";
import { analyzeSpeech } from "@/lib/training";

export async function POST(request: Request) {
  const user = await requireUser();
  const allowed = premiumAllowed(user, "speech");
  const data = await request.formData();
  const speechText = String(data.get("speech_text") || "");

  if (!allowed.ok) {
    return NextResponse.redirect(new URL("/speech-lab", request.url), { status: 303 });
  }

  try {
    const result = await analyzeSpeech(speechText);

    await incrementUsage(user.id, "usageSpeech");
    await logAction(user.id, "speech_lab", "Speech analyzed");

    const url = new URL("/speech-lab", request.url);
    url.searchParams.set("speech_text", speechText);
    url.searchParams.set("data", encodeURIComponent(JSON.stringify(result)));
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    console.error("SPEECH API ERROR:", error);
    return new NextResponse(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
