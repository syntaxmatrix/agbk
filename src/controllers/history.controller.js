import { asyncHandler } from "../utils/asyncHandler.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import mongoose from "mongoose";
import {
  DEFAULT_CONVERSATION_TITLE,
  buildConversationTitle,
} from "../utils/conversationTitle.js";

export const getRecentConversations = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const conversations = await Message.aggregate([
    {
      $match: {
        userId,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        latestMessage: { $first: "$content" },
        updatedAt: { $first: "$createdAt" },
        messages: {
          $push: {
            role: "$role",
            content: "$content",
            createdAt: "$createdAt",
          },
        },
      },
    },
    { $sort: { updatedAt: -1 } },
    { $limit: 20 },
  ]);

  const conversationIds = conversations.map((conversation) => conversation._id);
  const storedConversations = await Conversation.find({
    userId,
    conversationId: { $in: conversationIds },
  }).lean();
  const conversationMap = new Map(
    storedConversations.map((conversation) => [
      conversation.conversationId,
      conversation,
    ]),
  );

  const missingTitleUpdates = [];
  const history = conversations.map((conversation) => {
    const storedConversation = conversationMap.get(conversation._id);
    const firstUserMessage = [...conversation.messages]
      .reverse()
      .find((message) => message.role === "user");
    const derivedTitle = firstUserMessage
      ? buildConversationTitle(firstUserMessage.content)
      : DEFAULT_CONVERSATION_TITLE;
    const title = storedConversation?.title?.trim() || derivedTitle;

    if (
      storedConversation &&
      (!storedConversation.title || !storedConversation.title.trim()) &&
      title !== DEFAULT_CONVERSATION_TITLE
    ) {
      missingTitleUpdates.push({
        updateOne: {
          filter: { _id: storedConversation._id },
          update: { $set: { title } },
        },
      });
    } else if (!storedConversation) {
      missingTitleUpdates.push({
        updateOne: {
          filter: {
            userId,
            conversationId: conversation._id,
          },
          update: {
            $setOnInsert: {
              userId,
              conversationId: conversation._id,
              createdAt: conversation.updatedAt,
            },
            $set: {
              title,
              updatedAt: conversation.updatedAt,
            },
          },
          upsert: true,
        },
      });
    }

    return {
      _id: conversation._id,
      title,
      latestMessage: conversation.latestMessage,
      updatedAt: conversation.updatedAt,
    };
  });

  if (missingTitleUpdates.length > 0) {
    await Conversation.bulkWrite(missingTitleUpdates);
  }

  res.json({ ok: true, history });
});

export const getChatById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const conversationId = req.params.id;

  const messages = await Message.find({ userId, conversationId }).sort({
    createdAt: 1,
  });

  res.json({ ok: true, messages });
});
