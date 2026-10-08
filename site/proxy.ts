import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ararat-locale", request.nextUrl.pathname === "/" ? "en" : "pt");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/", "/pt", "/previa/:path*", "/teste/:path*"] };
