import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  // allow all requests
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
