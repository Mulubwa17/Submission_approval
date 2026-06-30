type EnvLike = Record<string, string | undefined>;

const DEFAULT_API_ORIGIN = "http://localhost:4000";
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";

function splitOrigins(value: string | undefined) {
  return (
    value
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}

function normalizeOrigin(origin: string) {
  if (origin === "*" || origin.includes("*")) {
    return origin.replace(/\/+$/, "");
  }

  return new URL(origin).origin;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function getAllowedOrigins(env: EnvLike = process.env) {
  const configuredOrigins = [
    ...splitOrigins(env.CORS_ORIGINS),
    ...splitOrigins(env.FRONTEND_ORIGIN)
  ];

  return unique(
    (configuredOrigins.length > 0
      ? configuredOrigins
      : [DEFAULT_FRONTEND_ORIGIN]
    ).map(normalizeOrigin)
  );
}

export function getBetterAuthBaseUrl(env: EnvLike = process.env) {
  return normalizeOrigin(env.BETTER_AUTH_URL ?? DEFAULT_API_ORIGIN);
}

function originPatternToRegex(pattern: string) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(`^${escaped.replaceAll("*", ".*")}$`);
}

export function isAllowedOrigin(origin: string, allowedOrigins: string[]) {
  const normalizedOrigin = normalizeOrigin(origin);

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === "*") {
      return true;
    }

    if (allowedOrigin.includes("*")) {
      return originPatternToRegex(allowedOrigin).test(normalizedOrigin);
    }

    return allowedOrigin === normalizedOrigin;
  });
}
