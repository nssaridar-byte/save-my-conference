import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { premiumAllowed, incrementUsage } from "@/lib/usage";
import { buildContextText } from "@/lib/context";
import { buildCrisis } from "@/lib/training";
import { logAction } from "@/lib/logs";

export async function POST(request: Request) {
  const user = await requireUser();
  const allowed = premiumAllowed(user, "crisis");
  const data = await request.formData();

  if (!allowed.ok) {
    return NextResponse.redirect(new URL("/crisis", request.url), { status: 303 });
  }

  const topic = String(data.get("topic") || "");
  const country = String(data.get("country") || "");
  const committee = String(data.get("committee") || "");
  const fileIds = data.getAll("fileIds").map((x) => Number(x)).filter(Boolean);

  try {
    const context = await buildContextText(user.id, fileIds);
    const result = await buildCrisis(topic || "General crisis", country || "The delegation", committee || "The committee", context);

    await incrementUsage(user.id, "usageCrisis");
    await logAction(user.id, "crisis", topic || "crisis");

    const url = new URL("/crisis", request.url);
    url.searchParams.set("topic", topic);
    url.searchParams.set("country", country);
    url.searchParams.set("committee", committee);
    url.searchParams.set("data", encodeURIComponent(JSON.stringify(result)));
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    console.error("CRISIS API ERROR:", error);
    return new NextResponse(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
