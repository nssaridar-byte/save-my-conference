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

  const target = Number(id);
  if (target !== admin.id) {
    await prisma.user.delete({
      where: { id: target }
    });
    await logAction(admin.id, "admin_delete_user", `Deleted user ${id}`);
  }

  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
