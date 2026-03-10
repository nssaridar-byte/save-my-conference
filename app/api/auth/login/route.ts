import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setUserSession, verifyPassword } from "@/lib/auth";
import { logAction } from "@/lib/logs";

export async function POST(request: Request) {
  const data = await request.formData();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  await setUserSession(user.id);
  await logAction(user.id, "login", "User logged in");

  return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
}
