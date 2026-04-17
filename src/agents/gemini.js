import { GoogleGenAI } from "@google/genai";
import { model_chat, model_intent } from "../constant.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function routeQuery(query) {
  const response = await ai.models.generateContent({
    model: model_intent,

    contents: `
You are a strict intent router for an AI assistant.

Your ONLY job is to classify the user's query into one of these routes:

1. "chat" → General conversation, factual questions, explanations, casual discussion, brainstorming, coding help, etc.
2. "gmail_agent" → ONLY if the user explicitly wants to perform an email/Gmail action.
3. "other_action" → ONLY if the user explicitly requests some other external tool/action such as image generation, media generation, file creation, etc.

IMPORTANT RULES:
- Default to "chat" unless the user is CLEARLY asking to perform an action.
- Do NOT classify informational questions about Gmail/email as gmail_agent unless user wants an actual action performed.
- Do NOT infer actions from vague wording.
- If unsure, choose "chat".
- Output MUST be valid JSON only.
- Do NOT include markdown/code fences/explanations.

Possible Gmail intents:
- read_email → User wants to read/check/list/search emails
- send_email → User wants to send an email
- draft_email → User wants to draft/compose an email

Schema:
{
  "route": "chat | gmail_agent | other_action",
  "intent": "optional",
  "entities": {
    "to": "optional",
    "topic": "optional"
  }
}

Examples:

User: "Tell me about CAA protest in India"
Output:
{
  "route": "chat"
}

User: "Read my latest emails"
Output:
{
  "route": "gmail_agent",
  "intent": "read_email"
}

User: "Send email to Rahul about tomorrow's meeting"
Output:
{
  "route": "gmail_agent",
  "intent": "send_email",
  "entities": {
    "to": "Rahul",
    "topic": "tomorrow's meeting"
  }
}

User: "Generate an image of a futuristic city"
Output:
{
  "route": "other_action"
}

User query: "${query}"
`,

    config: {
      responseMimeType: "application/json",
    },
  });

  const text = extractText(response);
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(
      "Failed to parse JSON from Gemini response in routeQuery:",
      err,
      text,
    );
    throw err;
  }
}

async function chatQuery(query) {
  const response = await ai.models.generateContent({
    model: model_chat,

    contents: `
You are an AI assistant.

Answer in brief until asked in detail.
Return JSON only.
Ensure formatted string reply.

Schema:
{
  "body": "your reply"
}

User query: "${query}"
`,

    config: {
      responseMimeType: "application/json",
    },
  });

  const text = extractText(response);
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(
      "Failed to parse JSON from Gemini response in chatQuery:",
      err,
      text,
    );
    throw err;
  }
}

async function draftMail(query) {
  const response = await ai.models.generateContent({
    model: model_chat,

    contents: `
You are a professional email writer.

Write a clear and well-structured email based on the user's request.

Return JSON only.

Schema:
{
  "to": "recipient email address",
  "subject": "email subject",
  "body": "complete email body"
}

Guidelines:
- Make the email polite and professional.
- Add greeting and closing.
- Infer subject if not given.
- Do not include anything outside JSON.

User request: "${query}"
`,

    config: {
      responseMimeType: "application/json",
    },
  });

  const text = extractText(response);
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(
      "Failed to parse JSON from Gemini response in draftMail:",
      err,
      text,
    );
    throw err;
  }
}

function extractText(response) {
  if (!response) return "";
  // If SDK already returned a string
  if (typeof response === "string") return response;
  // Common direct fields
  if (typeof response.text === "string") return response.text;
  if (typeof response.outputText === "string") return response.outputText;
  if (typeof response.output === "string") return response.output;

  // Candidates array (common shape)
  if (Array.isArray(response.candidates) && response.candidates.length) {
    const c = response.candidates[0];
    if (typeof c.text === "string") return c.text;
    if (typeof c.content === "string") return c.content;
    if (Array.isArray(c.content)) {
      for (const item of c.content) {
        if (typeof item.text === "string") return item.text;
      }
    }
  }

  // Output array with content items
  if (Array.isArray(response.output) && response.output.length) {
    for (const out of response.output) {
      if (typeof out.content === "string") return out.content;
      if (Array.isArray(out.content)) {
        for (const item of out.content) {
          if (typeof item.text === "string") return item.text;
        }
      }
    }
  }

  // output[0].content[0].text style
  try {
    if (response.output?.[0]?.content?.[0]?.text)
      return response.output[0].content[0].text;
  } catch (e) {}

  // As a last resort, stringify the whole response so the caller can inspect it
  return JSON.stringify(response);
}

export { routeQuery, chatQuery, draftMail };
