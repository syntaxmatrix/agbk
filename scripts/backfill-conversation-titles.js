import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const [{ default: mongoose }, { default: connectDB }, { default: Message }, { default: Conversation }, titleUtils] =
  await Promise.all([
    import("mongoose"),
    import("../src/utils/dbConfig.js"),
    import("../src/models/message.model.js"),
    import("../src/models/conversation.model.js"),
    import("../src/utils/conversationTitle.js"),
  ]);

const { DEFAULT_CONVERSATION_TITLE, buildConversationTitle } = titleUtils;

async function backfillConversationTitles() {
  await connectDB();

  const conversations = await Message.aggregate([
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: {
          userId: "$userId",
          conversationId: "$conversationId",
        },
        messages: {
          $push: {
            role: "$role",
            content: "$content",
          },
        },
        updatedAt: { $last: "$createdAt" },
      },
    },
  ]);

  let updatedCount = 0;

  for (const conversation of conversations) {
    const firstUserMessage = conversation.messages.find(
      (message) => message.role === "user",
    );
    const title = firstUserMessage
      ? buildConversationTitle(firstUserMessage.content)
      : DEFAULT_CONVERSATION_TITLE;

    const result = await Conversation.updateOne(
      {
        userId: new mongoose.Types.ObjectId(conversation._id.userId),
        conversationId: conversation._id.conversationId,
      },
      {
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(conversation._id.userId),
          conversationId: conversation._id.conversationId,
          createdAt: conversation.updatedAt ?? new Date(),
        },
        $set: {
          title,
          updatedAt: conversation.updatedAt ?? new Date(),
        },
      },
      { upsert: true },
    );

    updatedCount += result.upsertedCount + result.modifiedCount;
  }

  console.log(`Backfilled ${updatedCount} conversation title record(s).`);
  await mongoose.disconnect();
}

backfillConversationTitles().catch(async (error) => {
  console.error("Failed to backfill conversation titles:", error);
  await mongoose.disconnect();
  process.exit(1);
});
