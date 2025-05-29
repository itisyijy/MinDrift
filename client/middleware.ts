// client/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get("token")?.value;

  // 로그인이 안 되어있고 "/" 페이지 접속하면 로그인 페이지로 리디렉트
  if (!isLoggedIn && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"], // "/" 페이지 접근 시만 이 미들웨어 실행
};