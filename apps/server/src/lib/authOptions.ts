export const shouldSkipOAuthStateCookieCheck = (
  nodeEnv = process.env.NODE_ENV,
  requireStateCookie = process.env.AUTH_REQUIRE_STATE_COOKIE
) => nodeEnv === "production" && requireStateCookie !== "true";
