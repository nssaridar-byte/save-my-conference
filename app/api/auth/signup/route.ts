import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setUserSession } from "@/lib/auth";
import { logAction } from "@/lib/logs";

export async function POST(request: Request) {
  const data = await request.formData();
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");

  if (!name || !email || !password) {
    return NextResponse.redirect(new URL("/signup", request.url), { status: 303 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password)
    }
  });

  await setUserSession(user.id);
  await logAction(user.id, "signup", "New account created");

  return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
}
