import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { app } = await import("./app.js");
const { default: connectDB } = await import("./utils/dbConfig.js");

// Connect to MongoDB and start the server
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Server is RUNNING at PORT :", process.env.PORT);
      console.log(` Server Link : http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB CONNECTION FAILED !!!", err);
  });
