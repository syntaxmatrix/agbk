import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getEmailAttachment,
  getEmailDetails,
  listInboxEmails,
  sendEmail,
} from "../services/email.service.js";
import { logAdminAction } from "../services/admin.service.js";

const sendAdminEmail = asyncHandler(async (req, res) => {
  const data = await sendEmail(req.body);

  await logAdminAction({
    adminId: req.user._id,
    action: data.mode === "broadcast" ? "SEND_BROADCAST_EMAIL" : "SEND_EMAIL",
    metadata: {
      to: req.body.to,
      subject: req.body.subject,
      bodyType: req.body.bodyType,
      mode: data.mode,
      recipientCount: data.recipientCount || 1,
    },
  });

  return res
    .status(200)
    .json(new APIResponse(200, data, "Email sent successfully"));
});

const getInboxEmails = asyncHandler(async (req, res) => {
  const data = await listInboxEmails();

  return res
    .status(200)
    .json(new APIResponse(200, data, "Inbox emails fetched successfully"));
});

const getInboxEmailById = asyncHandler(async (req, res) => {
  const data = await getEmailDetails(req.params.id);

  return res
    .status(200)
    .json(new APIResponse(200, data, "Email details fetched successfully"));
});

const getInboxAttachment = asyncHandler(async (req, res) => {
  const data = await getEmailAttachment(req.params.id, req.params.attachmentId);

  return res
    .status(200)
    .json(
      new APIResponse(200, data, "Attachment details fetched successfully"),
    );
});

export {
  sendAdminEmail,
  getInboxEmails,
  getInboxEmailById,
  getInboxAttachment,
};
