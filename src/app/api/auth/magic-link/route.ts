import prisma from "@/lib/prisma";
import { setSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");
  const authCode = searchParams.get("authCode");

  if (teacherId && authCode === `vocali${teacherId}`) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (teacher) {
      await setSession("teacher", teacherId);
      // Redirect to the teacher panel
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
  }

  // If validation fails, redirect to login page with an error parameter
  return NextResponse.redirect(new URL("/sign-in?error=invalid_link", request.url));
}
