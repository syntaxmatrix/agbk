import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "ai"], required: true },
    content: { type: Schema.Types.Mixed, required: true },
    conversationId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
