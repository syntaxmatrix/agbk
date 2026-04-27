import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import AuditLog from "../models/auditLog.model.js";
import { APIError } from "../utils/APIError.js";

const VALID_SUBSCRIPTION_PLANS = ["Free", "Premium", "Ultimate"];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getPagination = (pageQuery, limitQuery) => {
  const page = Number.parseInt(pageQuery, 10) || DEFAULT_PAGE;
  const limit = Number.parseInt(limitQuery, 10) || DEFAULT_LIMIT;

  return {
    page: Math.max(page, 1),
    limit: Math.min(Math.max(limit, 1), MAX_LIMIT),
  };
};

const getSafeUserProjection = "-password -refreshToken -securityCode";

const getUsers = async ({ q, page: pageQuery, limit: limitQuery }) => {
  const { page, limit } = getPagination(pageQuery, limitQuery);
  const query = {};

  if (q?.trim()) {
    const search = q.trim();
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select(getSafeUserProjection)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return { users, total, page };
};

const getUserById = async (id) => {
  if (!isValidObjectId(id)) {
    throw new APIError(400, "Invalid user id");
  }

  const user = await User.findById(id).select(getSafeUserProjection);

  if (!user) {
    throw new APIError(404, "User not found");
  }

  return user;
};

const deleteUserAndMessages = async (id) => {
  if (!isValidObjectId(id)) {
    throw new APIError(400, "Invalid user id");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new APIError(404, "User not found");
  }

  const deletedMessages = await Message.deleteMany({ userId: id });
  await User.findByIdAndDelete(id);

  return {
    deletedUserId: id,
    deletedMessages: deletedMessages.deletedCount || 0,
  };
};

const updateSubscription = async (id, { plan, expiry }) => {
  if (!isValidObjectId(id)) {
    throw new APIError(400, "Invalid user id");
  }

  if (!VALID_SUBSCRIPTION_PLANS.includes(plan)) {
    throw new APIError(
      400,
      `Invalid subscription plan. Allowed plans: ${VALID_SUBSCRIPTION_PLANS.join(", ")}`,
    );
  }

  if (!expiry) {
    throw new APIError(400, "Subscription expiry is required");
  }

  const expiryDate = new Date(expiry);

  if (Number.isNaN(expiryDate.getTime())) {
    throw new APIError(400, "Invalid subscription expiry date");
  }

  const user = await User.findByIdAndUpdate(
    id,
    {
      subscription: plan,
      subscriptionExpiry: expiryDate,
    },
    { new: true, runValidators: true },
  ).select(getSafeUserProjection);

  if (!user) {
    throw new APIError(404, "User not found");
  }

  return user;
};

const getStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, freeUsers, premiumUsers, ultimateUsers, newUsersToday] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscription: "Free" }),
      User.countDocuments({ subscription: "Premium" }),
      User.countDocuments({ subscription: "Ultimate" }),
      User.countDocuments({ createdAt: { $gte: today } }),
    ]);

  return {
    totalUsers,
    freeUsers,
    premiumUsers,
    ultimateUsers,
    newUsersToday,
  };
};

const forceLogoutUser = async (id) => {
  if (!isValidObjectId(id)) {
    throw new APIError(400, "Invalid user id");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { refreshToken: null },
    { new: true, validateBeforeSave: false },
  ).select(getSafeUserProjection);

  if (!user) {
    throw new APIError(404, "User not found");
  }

  return user;
};

const logAdminAction = async ({
  adminId,
  action,
  targetUserId = null,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      targetUserId,
      metadata,
    });
  } catch (error) {
    console.error("Failed to write admin audit log:", error.message);
  }
};

export {
  VALID_SUBSCRIPTION_PLANS,
  getUsers,
  getUserById,
  deleteUserAndMessages,
  updateSubscription,
  getStats,
  forceLogoutUser,
  logAdminAction,
};
