import crypto from "crypto";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";
const TURNSTILE_TIMEOUT_MS = 5000;

const getTurnstileSecret = () => {
  // Cloudflare localhost/test sitekeys issue dummy tokens that only validate
  // against the official test secret. Production must always use the real secret.
  if (process.env.NODE_ENV !== "production") {
    return TURNSTILE_TEST_SECRET;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY is not configured");
  }

  return secret;
};

const verifyTurnstileToken = async (token, remoteIp) => {
  if (!token || typeof token !== "string" || !token.trim()) {
    return { ok: false, reason: "missing_token" };
  }

  const payload = new URLSearchParams({
    secret: getTurnstileSecret(),
    response: token.trim(),
    idempotency_key: crypto.randomUUID(),
  });

  if (remoteIp) {
    payload.append("remoteip", remoteIp);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Turnstile siteverify responded with HTTP error", {
        status: response.status,
      });
      return { ok: false, reason: "service_unavailable" };
    }

    if (!result?.success) {
      console.warn("Turnstile token rejected", {
        errorCodes: Array.isArray(result?.["error-codes"])
          ? result["error-codes"]
          : [],
      });
      return { ok: false, reason: "invalid_token" };
    }

    return { ok: true, data: result };
  } catch (error) {
    console.error("Turnstile verification request failed", {
      message: error?.name === "AbortError" ? "timeout" : error?.message,
    });
    return { ok: false, reason: "service_unavailable" };
  } finally {
    clearTimeout(timeout);
  }
};

export { verifyTurnstileToken };
