import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allowedFile, extractText, saveIncomingFile } from "@/lib/files";
import { logAction } from "@/lib/logs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser();
  const data = await request.formData();
  const files = data.getAll("files") as File[];

  for (const file of files) {
    if (!file || !file.name) continue;
    if (!allowedFile(file.name)) continue;

    const saved = await saveIncomingFile(file);
    const extractedText = await extractText(saved.fullPath, saved.ext);

    await prisma.libraryFile.create({
      data: {
        userId: user.id,
        originalName: file.name,
        storedName: saved.storedName,
        fileType: saved.ext,
        extractedText
      }
    });
  }

  await logAction(user.id, "upload_library", `${files.length} file(s)`);
  return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
}
