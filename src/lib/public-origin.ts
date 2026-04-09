/**
 * Origem pública HTTPS do app (evita http://localhost:PORT atrás do proxy Railway/Vercel).
 */
export function publicAppOriginFromWindow(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function publicAppOriginFromRequest(
  request: Request,
  getHeader: (name: string) => string | null
): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const xfHost = getHeader("x-forwarded-host")?.split(",")[0]?.trim();
  const xfProto =
    getHeader("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  if (xfHost) return `${xfProto}://${xfHost}`;

  return new URL(request.url).origin;
}
