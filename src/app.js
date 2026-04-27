import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : [];

const devOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://192.168.1.5:3000", // Adjust this to your local IP(Router) and port
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser requests
      if (!origin) return callback(null, true);

      // allow exact matches
      if (
        allowedOrigins.includes(origin) ||
        devOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      // allow  root and all subdomains of syntx.in
      if ( origin === "https://syntx.in" || origin.endsWith(".syntx.in")) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS"),
        false
      );
    },
    credentials: true, // Important for sending cookies with cross-origin requests
  }),
);

app.get("/api/v1/hello", (req, res) => {
  //verification for beckend and frontend connections
  res.json({ message: "Agent's Express Backend is Connected with You !" });
});

app.get("/", (req, res) => {
  res.send(`
    Backend API running 🚀
`);
});

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SECRET, // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      httpOnly: true, // Prevent client-side JS access
      // CRITICAL FOR CROSS-ORIGIN:
      sameSite: "Lax", // Allow cross-site cookies
      maxAge: 1000 * 60 * 15, // 15 minutes (adjust as needed)
      domain: process.env.COOKIE_DOMAIN,
    },
  }),
);

//routes import
import userRouter from "./routes/user.routes.js";
import agentRouter from "./routes/agent.routes.js";
import historyRouter from "./routes/history.routes.js";
import adminRouter from "./routes/admin.routes.js";
import adminEmailRouter from "./routes/admin.email.routes.js";

//routes declarations
app.use("/api/v1/user", userRouter); // example.com/api/v1/user/register
app.use("/api/v1/agent", agentRouter); // example.com/api/v1/agent/test
app.use("/api/v1/history", historyRouter); // Use the exact path requested by user
app.use("/api/v1/admin", adminRouter); // example.com/api/v1/admin/users
app.use("/api/v1/admin/email", adminEmailRouter); // example.com/api/v1/admin/email/send

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    ok: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export { app };
