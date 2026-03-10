import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/logs";

export async function POST(request: Request) {
  const user = await requireUser();
  const data = await request.formData();

  const name = String(data.get("name") || "");
  const committee = String(data.get("committee") || "");
  const country = String(data.get("country") || "");
  const topic = String(data.get("topic") || "");
  const eventDatetime = String(data.get("eventDatetime") || "");
  const summary = String(data.get("summary") || "");

  if (!name || !committee || !country || !topic || !eventDatetime) {
    return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
  }

  await prisma.conference.create({
    data: {
      userId: user.id,
      name,
      committee,
      country,
      topic,
      eventDatetime,
      summary: summary || null
    }
  });

  await logAction(user.id, "create_conference", name);
  return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
}
