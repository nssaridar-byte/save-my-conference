import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { premiumAllowed, incrementUsage } from "@/lib/usage";
import { buildContextText } from "@/lib/context";
import { buildQuiz } from "@/lib/training";
import { logAction } from "@/lib/logs";

export async function POST(request: Request) {
  const user = await requireUser();
  const allowed = premiumAllowed(user, "quiz");
  const data = await request.formData();

  if (!allowed.ok) {
    return NextResponse.redirect(new URL("/quiz", request.url), { status: 303 });
  }

  const topic = String(data.get("topic") || "");
  const fileIds = data.getAll("fileIds").map((x) => Number(x)).filter(Boolean);
  try {
    const context = await buildContextText(user.id, fileIds);
    const quiz = await buildQuiz(topic || "General MUN research", context);

    await incrementUsage(user.id, "usageQuiz");
    await logAction(user.id, "quiz", topic || "quiz");

    const url = new URL("/quiz", request.url);
    url.searchParams.set("topic", topic);
    url.searchParams.set("data", encodeURIComponent(JSON.stringify(quiz)));
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    console.error("QUIZ API ERROR:", error);
    return new NextResponse(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
