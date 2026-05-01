function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isEmailContent(value) {
  return isPlainObject(value) && value.type === "email";
}

function buildEmailContent({
  status,
  to = "",
  subject = "",
  body = "",
  labelIds,
}) {
  const emailContent = {
    type: "email",
    status,
    to,
    subject,
    body,
  };

  if (Array.isArray(labelIds) && labelIds.length > 0) {
    emailContent.labelIds = labelIds;
  }

  return emailContent;
}

function normalizeAiContent(content, fallbackStatus = "draft") {
  if (isEmailContent(content)) {
    return content;
  }

  if (typeof content === "string") {
    return content;
  }

  if (!isPlainObject(content)) {
    return content ?? "";
  }

  if (
    typeof content.to === "string" &&
    typeof content.subject === "string" &&
    typeof content.body === "string"
  ) {
    return buildEmailContent({
      status: content.status || fallbackStatus,
      to: content.to,
      subject: content.subject,
      body: content.body,
      labelIds: content.labelIds,
    });
  }

  if (typeof content.body === "string" && Object.keys(content).length === 1) {
    return content.body;
  }

  return content;
}

function getMessageTextContent(content) {
  if (typeof content === "string") {
    return content;
  }

  if (isEmailContent(content)) {
    const prefix = content.status === "sent" ? "Sent email" : "Draft email";
    const subject = content.subject?.trim() || "No subject";
    const body = content.body?.trim() || "";
    return `${prefix} to ${content.to || "unknown recipient"}: ${subject}${body ? `\n${body}` : ""}`;
  }

  if (isPlainObject(content) && typeof content.body === "string") {
    return content.body;
  }

  if (content == null) {
    return "";
  }

  return JSON.stringify(content);
}

export { buildEmailContent, getMessageTextContent, isEmailContent, normalizeAiContent };
