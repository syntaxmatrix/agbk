import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const subscription = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    throw new APIError(401, "Unauthorized");
  }

  const isFree = user.subscription === "Free";

  const isExpired =
    user.subscriptionExpiry &&
    new Date(user.subscriptionExpiry) < new Date();

  if (isFree || isExpired) {
    throw new APIError(
      403,
      "Upgrade to Premium or Ultimate to access this feature.Contact support for more details."
    );
  }

  next();
});