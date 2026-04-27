import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const parseAdminEmails = (value = "") =>
  (value.match(/[^\s,;<>()]+@[^\s,;<>()]+\.[^\s,;<>()]+/g) || []).map((email) =>
    email.trim().toLowerCase(),
  );

export const adminOnly = asyncHandler(async (req, res, next) => {
  const userEmail = req.user?.email?.trim().toLowerCase();
  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

  if (!userEmail || !adminEmails.includes(userEmail)) {
    throw new APIError(403, "Forbidden: Admins only");
  }

  next();
});
