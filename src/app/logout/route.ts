import { clearSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await clearSession();
  return NextResponse.redirect(new URL("/", request.url));
}
