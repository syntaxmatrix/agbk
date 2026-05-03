import crypto from "crypto";
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

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
  req.body?.turnstileToken || req.body?.["cf-turnstile-response"];

const verifyTurnstile = asyncHandler(async (req, res, next) => {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    throw new APIError(500, "TURNSTILE_SECRET_KEY is not configured");
  }

  const token = getTurnstileToken(req);
  if (!token || typeof token !== "string" || !token.trim()) {
    throw new APIError(400, "Turnstile token is required");
  }

  const payload = new URLSearchParams({
    secret,
    response: token.trim(),
    idempotency_key: crypto.randomUUID(),
  });

  const remoteIp = getClientIp(req);
  if (remoteIp) {
    payload.append("remoteip", remoteIp);
  }

  let response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });
  } catch (error) {
    console.error("Turnstile verification request failed:", error.message);
    throw new APIError(502, "Turnstile verification failed");
  }

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success) {
    const errorCodes = Array.isArray(result?.["error-codes"])
      ? result["error-codes"]
      : [];

    throw new APIError(
      400,
      `Turnstile verification failed${errorCodes.length ? `: ${errorCodes.join(", ")}` : ""}`,
    );
  }

  req.turnstile = result;
  next();
});

export { verifyTurnstile };
