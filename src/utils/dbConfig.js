import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

export default async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DB_NAME,
    });
    console.log(
      `\n MongoDB Connected !! DB HOST : ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.log("Error with DB Connection", error);
    process.exit(1);
  }
}
