import { asyncHandler } from "../utils/asyncHandler.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

export const getRecentConversations = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  // Group by conversationId, get the most recent message for each
  const conversations = await Message.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(req.user._id)
      } 
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        latestMessage: { $first: "$content" },
        updatedAt: { $first: "$createdAt" }
      }
    },
    { $sort: { updatedAt: -1 } },
    { $limit: 20 }
  ]);

  res.json({ ok: true, history: conversations });
});

export const getChatById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const conversationId = req.params.id;

  const messages = await Message.find({ userId, conversationId }).sort({ createdAt: 1 });
  
  res.json({ ok: true, messages });
});
