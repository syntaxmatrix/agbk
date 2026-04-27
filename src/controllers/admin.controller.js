import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import {
  deleteUserAndMessages,
  forceLogoutUser,
  getAllUserEmailsForCsv,
  getStats,
  getUserById,
  getUsers,
  logAdminAction,
  updateSubscription,
} from "../services/admin.service.js";

const ensureBody = (body) => {
  if (!body || Object.keys(body).length === 0) {
    throw new APIError(400, "Request body cannot be empty");
  }
};

const listUsers = asyncHandler(async (req, res) => {
  const data = await getUsers(req.query);

  return res
    .status(200)
    .json(new APIResponse(200, data, "Users fetched successfully"));
});

const getSingleUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);

  return res
    .status(200)
    .json(new APIResponse(200, { user }, "User fetched successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const data = await deleteUserAndMessages(req.params.id);

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_USER",
    targetUserId: req.params.id,
    metadata: data,
  });

  return res
    .status(200)
    .json(new APIResponse(200, data, "User deleted successfully"));
});

const patchUserSubscription = asyncHandler(async (req, res) => {
  ensureBody(req.body);

  const user = await updateSubscription(req.params.id, req.body);

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_SUBSCRIPTION",
    targetUserId: req.params.id,
    metadata: {
      plan: req.body.plan,
      expiry: req.body.expiry,
    },
  });

  return res
    .status(200)
    .json(new APIResponse(200, { user }, "Subscription updated successfully"));
});

const getAdminStats = asyncHandler(async (req, res) => {
  const stats = await getStats();

  return res
    .status(200)
    .json(new APIResponse(200, stats, "Stats fetched successfully"));
});

const downloadUserEmailsCsv = asyncHandler(async (req, res) => {
  const emails = await getAllUserEmailsForCsv();
  const csvRows = [
    "email",
    ...emails.map((email) => `"${email.replace(/"/g, '""')}"`),
  ];
  const csvContent = csvRows.join("\n");

  await logAdminAction({
    adminId: req.user._id,
    action: "EXPORT_USER_EMAILS_CSV",
    metadata: {
      exportedCount: emails.length,
    },
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="users-emails-${Date.now()}.csv"`,
  );

  return res.status(200).send(csvContent);
});

const forceLogout = asyncHandler(async (req, res) => {
  const user = await forceLogoutUser(req.params.id);

  await logAdminAction({
    adminId: req.user._id,
    action: "FORCE_LOGOUT",
    targetUserId: req.params.id,
  });

  return res
    .status(200)
    .json(new APIResponse(200, { user }, "User logged out successfully"));
});

export {
  listUsers,
  getSingleUser,
  deleteUser,
  patchUserSubscription,
  getAdminStats,
  downloadUserEmailsCsv,
  forceLogout,
};
