import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { routeQuery, chatQuery, draftMail } from "../agents/gemini.js";
import { sendgmail } from "../integrations/Google/gmail.js";
import { oauth2ClientGmail } from "../integrations/Auth/gmail.google.js";
import Conversation from "../models/conversation.model.js";
import {
  buildConversationTitle,
  normalizeConversationTitle,
} from "../utils/conversationTitle.js";

/**
 * Function to remove unwanted string to convert JSON.
 * @param {string} str
 * @returns {string}
 */
function cleanJsonString(str) {
  return str
    .replace(/```json\s*/i, "") // remove opening ```json
    .replace(/```$/, "") // remove closing ```
    .trim(); // clean extra spaces
}

import Message from "../models/message.model.js";

/**
 * intent check Function for Gemini Response.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const intentCheck = asyncHandler(async (req, res) => {
  try {
    // q is the natural-language query from the client.
    let { q, conversationId } = req?.query;

    if (!conversationId) {
      throw new APIError(400, "conversationId is required");
    }

    const normalizedQuery = normalizeConversationTitle(q);
    const initialTitle = buildConversationTitle(normalizedQuery);
    const conversation = await Conversation.findOne({
      userId: req.user._id,
      conversationId,
    });

    if (!conversation) {
      await Conversation.create({
        userId: req.user._id,
        conversationId,
        title: initialTitle,
      });
    } else {
      if (!conversation.title || !conversation.title.trim()) {
        conversation.title = initialTitle;
      }
      conversation.updatedAt = new Date();
      await conversation.save();
    }

    // [MODIFICATION] Save User Message EARLY
    // This ensures the conversation shows up in Recent Activity even if the AI fails later.
    await Message.create({
      userId: req.user._id,
      role: "user",
      content: q,
      conversationId,
    });

    // [MODIFICATION] Fetch Recent Chat History for Context
    const history = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(10);
    const context = history
      .reverse()
      .map((m) => `${m.role === "ai" ? "Assistant" : "User"}: ${m.content}`)
      .join("\n");

    // Logged-in user's Gmail refresh token, used for Gmail actions.
    let googleRefreshToken = req?.user?.googleRefreshToken;
    // ans will hold the final response based on selected route.
    let ans;
    // routeQuery classifies the user request into chat/gmail agent routes.
    const text = await routeQuery(q);
    // text.route
    if (text.route === "chat") {
      // Direct conversational response path.
      ans = await chatQ(q, context);
    } else if (text.route === "gmail_agent") {
      // Gmail-specific intents like draft/send email.
      ans = await GmailAgent(text, q, googleRefreshToken, context);
    } else {
      // Fallback when model route is unknown.
      ans = "No valid route found in the response.";
    }

    // Save AI Message
    await Message.create({
      userId: req.user._id,
      role: "ai",
      content: ans || "No answer generated",
      conversationId,
    });

    // Return both routing metadata and generated answer.
    res.json({ ok: true, text: text, ans: ans || "No answer generated" });
  } catch (err) {
    console.error("/gen error", err);
    let message = err?.message || "Unknown error";

    // Attempt to parse out a cleaner message if it's a JSON string
    try {
      if (typeof message === "string" && message.includes("{")) {
        const jsonMatch = message.match(/{.*}/s);
        if (jsonMatch) {
          const errorObj = JSON.parse(jsonMatch[0]);
          message = errorObj?.error?.message || message;
        }
      }
    } catch (parseErr) {}

    // Gentle Error Handling: Simplify technical jargon for the end user
    if (
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("rate limit") ||
      message.includes("429")
    ) {
      message = "Rate limit reached. Please wait a moment and try again.";
    } else if (
      message.toLowerCase().includes("not found") ||
      message.toLowerCase().includes("supported")
    ) {
      message =
        "The AI service is temporarily adjusting. Please try again in a few seconds.";
    }

    res.status(500).json({
      ok: false,
      message: message,
    });
  }
});

/**
 * Chat Query function.
 * @param {String} query - String Query.
 */
async function chatQ(query, context) {
  try {
    // Delegates free-form chat generation to Gemini chat agent.
    const text = await chatQuery(
      `${context ? "Chat History:\n" + context + "\n\n" : ""}User: ${query}`,
    );
    return text;
  } catch (err) {
    console.error("/chat error", err);
  }
}

async function GmailAgent(text, query, googleRefreshToken, context) {
  if (text.intent === "draft_email") {
    // Draft only: generate subject/body, do not send.
    return await draftMail(
      `${context ? "Chat History:\n" + context + "\n\n" : ""}User request: ${query}`,
    );
  } else if (text.intent === "send_email") {
    // Build email content first from user intent.
    const emailContent = await draftMail(
      `${context ? "Chat History:\n" + context + "\n\n" : ""}User request: ${query}`,
    );
    // Handle send email logic using emailContent
    // Send via Gmail integration using stored refresh token for auth.
    const data = await sendgmail(
      oauth2ClientGmail,
      text.entities.to,
      emailContent.subject,
      emailContent.body,
      googleRefreshToken,
    );
    const res = {
      body: "Email sent successfully! to " + text.entities.to,
      data: data,
    };
    return res;
  } else if (text.intent === "read_email") {
    // Handle read email logic
  } else {
    // Guard against unsupported or malformed intent values.
    throw new APIError("Invalid intent for Gmail Agent");
  }
}

export { chatQ, intentCheck, GmailAgent };
