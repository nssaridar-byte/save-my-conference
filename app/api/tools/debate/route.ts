import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { premiumAllowed, incrementUsage } from "@/lib/usage";
import { buildContextText } from "@/lib/context";
import { buildDebate } from "@/lib/training";
import { logAction } from "@/lib/logs";

export async function POST(request: Request) {
  const user = await requireUser();
  const allowed = premiumAllowed(user, "debate");
  const data = await request.formData();

  if (!allowed.ok) {
    return NextResponse.redirect(new URL("/debate", request.url), { status: 303 });
  }

  const yourCountry = String(data.get("your_country") || "");
  const opponentCountry = String(data.get("opponent_country") || "");
  const topic = String(data.get("topic") || "");
  const fileIds = data.getAll("fileIds").map((x) => Number(x)).filter(Boolean);

  try {
    const context = await buildContextText(user.id, fileIds);
    const result = await buildDebate(yourCountry || "Your delegation", opponentCountry || "Opponent", topic || "the topic", context);

    await incrementUsage(user.id, "usageDebate");
    await logAction(user.id, "debate", `${yourCountry} vs ${opponentCountry}`);

    const url = new URL("/debate", request.url);
    url.searchParams.set("your_country", yourCountry);
    url.searchParams.set("opponent_country", opponentCountry);
    url.searchParams.set("topic", topic);
    url.searchParams.set("data", encodeURIComponent(JSON.stringify(result)));
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    console.error("DEBATE API ERROR:", error);
    return new NextResponse(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
