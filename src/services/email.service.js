import { Resend } from "resend";
import User from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { ProductName, emailUpdates, emailSupport } from "../constant.js";

const VALID_BODY_TYPES = ["text", "html"];
const VALID_SENDER_TYPES = ["updates", "support"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new APIError(500, "RESEND_API_KEY is not configured");
  }

  return new Resend(process.env.RESEND_API_KEY);
};

const validateSendPayload = ({
  to,
  subject,
  bodyType,
  content,
  senderType = "support",
}) => {
  if (!to || !subject || !bodyType || !content) {
    throw new APIError(400, "to, subject, bodyType and content are required");
  }

  if (
    typeof to !== "string" ||
    typeof subject !== "string" ||
    typeof bodyType !== "string" ||
    typeof content !== "string"
  ) {
    throw new APIError(
      400,
      "to, subject, bodyType and content must be strings",
    );
  }

  if (typeof senderType !== "string") {
    throw new APIError(400, "senderType must be a string");
  }

  if (!VALID_BODY_TYPES.includes(bodyType)) {
    throw new APIError(
      400,
      `Invalid bodyType. Allowed values: ${VALID_BODY_TYPES.join(", ")}`,
    );
  }

  if (!VALID_SENDER_TYPES.includes(senderType)) {
    throw new APIError(
      400,
      `Invalid senderType. Allowed values: ${VALID_SENDER_TYPES.join(", ")}`,
    );
  }

  if (!subject.trim() || !content.trim()) {
    throw new APIError(400, "subject and content cannot be empty");
  }

  if (to !== "all" && !EMAIL_REGEX.test(to.trim())) {
    throw new APIError(400, "Invalid recipient email");
  }
};

const getSenderConfig = (senderType = "support") => {
  if (senderType === "updates") {
    return {
      from: `${ProductName} Updates <${emailUpdates}>`,
      replyTo: emailSupport,
    };
  }

  return {
    from: `${ProductName} Support <${emailSupport}>`,
    replyTo: undefined,
  };
};

const sendResendRequest = async ({
  resend,
  from,
  replyTo,
  to,
  subject,
  bodyType,
  content,
}) => {
  const { data, error } = await resend.emails.send({
    from,
    replyTo,
    to,
    subject,
    text: bodyType === "text" ? content : undefined,
    html: bodyType === "html" ? content : undefined,
  });

  if (error) {
    throw new APIError(502, error.message || "Failed to send email");
  }

  return data;
};

const getBroadcastRecipients = async () => {
  const users = await User.find({ email: { $exists: true, $ne: "" } })
    .select("email")
    .lean();

  const uniqueEmails = [
    ...new Set(
      users
        .map((user) => user.email?.trim())
        .filter((email) => email && EMAIL_REGEX.test(email)),
    ),
  ];

  if (!uniqueEmails.length) {
    throw new APIError(404, "No user emails available for broadcast");
  }

  return uniqueEmails;
};

const sendSingleEmail = ({
  to,
  subject,
  bodyType,
  content,
  senderType = "support",
}) => {
  validateSendPayload({ to, subject, bodyType, content, senderType });

  const resend = getResendClient();
  const { from, replyTo } = getSenderConfig(senderType);

  return sendResendRequest({
    resend,
    from,
    replyTo,
    to: to.trim(),
    subject: subject.trim(),
    bodyType,
    content,
  });
};

const sendSingleEmailResult = async ({
  to,
  subject,
  bodyType,
  content,
  senderType = "support",
}) => {
  const result = await sendSingleEmail({
    to,
    subject,
    bodyType,
    content,
    senderType,
  });

  return {
    mode: "single",
    senderType,
    recipient: to.trim(),
    result,
  };
};

const sendBroadcastEmail = async ({
  subject,
  bodyType,
  content,
  senderType = "support",
}) => {
  validateSendPayload({ to: "all", subject, bodyType, content, senderType });

  const resend = getResendClient();
  const { from, replyTo } = getSenderConfig(senderType);
  const recipients = await getBroadcastRecipients();
  const audienceName = `admin-broadcast-${Date.now()}`;

  const { data: audience, error: audienceError } =
    await resend.audiences.create({
      name: audienceName,
    });

  if (audienceError || !audience?.id) {
    throw new APIError(
      502,
      audienceError?.message || "Failed to create Resend audience",
    );
  }

  for (const email of recipients) {
    const { error } = await resend.contacts.create({
      email,
      audienceId: audience.id,
      unsubscribed: false,
    });

    if (error) {
      throw new APIError(
        502,
        `Failed to add ${email} to broadcast audience: ${error.message}`,
      );
    }
  }

  const { data: result, error: broadcastError } =
    await resend.broadcasts.create({
      audienceId: audience.id,
      from,
      replyTo,
      subject: subject.trim(),
      text: bodyType === "text" ? content : undefined,
      html: bodyType === "html" ? content : undefined,
      send: true,
      name: audienceName,
    });

  if (broadcastError) {
    throw new APIError(
      502,
      broadcastError.message || "Failed to create broadcast",
    );
  }

  return {
    mode: "broadcast",
    senderType,
    recipientCount: recipients.length,
    audienceId: audience.id,
    result,
  };
};

const sendEmail = async ({
  to,
  subject,
  bodyType,
  content,
  senderType = "support",
}) => {
  if (to === "all") {
    return sendBroadcastEmail({ subject, bodyType, content, senderType });
  }

  return sendSingleEmailResult({ to, subject, bodyType, content, senderType });
};

const listInboxEmails = async () => {
  const resend = getResendClient();
  const { data, error } = await resend.emails.receiving.list();

  if (error) {
    throw new APIError(502, error.message || "Failed to fetch received emails");
  }

  return data;
};

const getEmailDetails = async (id) => {
  if (!id?.trim()) {
    throw new APIError(400, "Email id is required");
  }

  const resend = getResendClient();
  const { data, error } = await resend.emails.receiving.get(id.trim());

  if (error) {
    throw new APIError(502, error.message || "Failed to fetch email details");
  }

  return data;
};

const getEmailAttachment = async (id, attachmentId) => {
  if (!id?.trim() || !attachmentId?.trim()) {
    throw new APIError(400, "Email id and attachment id are required");
  }

  const resend = getResendClient();
  const { data, error } = await resend.emails.receiving.attachments.get({
    emailId: id.trim(),
    id: attachmentId.trim(),
  });

  if (error) {
    throw new APIError(
      502,
      error.message || "Failed to fetch attachment details",
    );
  }

  return data;
};

export { sendEmail, listInboxEmails, getEmailDetails, getEmailAttachment };
