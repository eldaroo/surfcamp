// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "es"];
const defaultLocale = "en";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ⛔ Rutas que NO deben pasar por el redirect de locales
  const isSpecialPath =
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.match(/\.[^/]+$/); // archivos (.png, .js, .ico, etc)

  if (isSpecialPath) {
    return NextResponse.next();
  }

  // Si ya tiene /en o /es, no tocamos
  const hasLocale = locales.some(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!hasLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Opcional pero recomendable: limitar el matcher
export const config = {
  matcher: ["/((?!sitemap.xml|robots.txt|_next|api|.*\\..*).*)"],
};
