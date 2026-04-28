const DEFAULT_CONVERSATION_TITLE = "New Chat";
const MAX_CONVERSATION_TITLE_LENGTH = 100;

function normalizeConversationTitle(content) {
  if (content == null) {
    return "";
  }

  const text = Array.isArray(content)
    ? content.join(" ")
    : typeof content === "string"
      ? content
      : typeof content === "object"
        ? JSON.stringify(content)
        : String(content);

  return text.replace(/\s+/g, " ").trim();
}

function buildConversationTitle(content) {
  const normalized = normalizeConversationTitle(content);

  if (!normalized) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  if (normalized.length <= MAX_CONVERSATION_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_CONVERSATION_TITLE_LENGTH - 3).trim()}...`;
}

export {
  DEFAULT_CONVERSATION_TITLE,
  MAX_CONVERSATION_TITLE_LENGTH,
  normalizeConversationTitle,
  buildConversationTitle,
};
