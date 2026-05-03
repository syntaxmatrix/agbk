import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyTurnstileToken } from "../services/turnstile.service.js";

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string" && cfIp.trim()) {
    return cfIp.trim();
  }

  return req.socket?.remoteAddress || undefined;
};

const getTurnstileToken = (req) =>
  req.body?.turnstileToken ||
  req.body?.["cf-turnstile-response"] ||
  req.query?.turnstileToken ||
  req.query?.["cf-turnstile-response"];

const verifyTurnstile = asyncHandler(async (req, res, next) => {
  const token = getTurnstileToken(req);

  if (!token || typeof token !== "string" || !token.trim()) {
    throw new APIError(400, "Turnstile token is required");
  }

  const result = await verifyTurnstileToken(token, getClientIp(req));

  if (!result.ok) {
    if (result.reason === "invalid_token") {
      throw new APIError(400, "Turnstile verification failed");
    }

    throw new APIError(502, "Unable to verify Turnstile at this time");
  }

  req.turnstile = result.data;
  next();
});

export { verifyTurnstile };
