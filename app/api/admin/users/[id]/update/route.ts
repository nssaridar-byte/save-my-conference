import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/logs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = await request.formData();

  await prisma.user.update({
    where: { id: Number(id) },
    data: {
      plan: String(data.get("plan") || "free"),
      role: String(data.get("role") || "user"),
      isActive: String(data.get("isActive") || "1") === "1"
    }
  });

  await logAction(admin.id, "admin_update_user", `Updated user ${id}`);
  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
