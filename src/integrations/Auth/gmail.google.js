import { google } from "googleapis";
import crypto from "crypto";
import { asyncHandler } from "../../utils/asyncHandler.js";

const oauth2ClientGmail = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Access scopes for two non-Sign-In scopes: Read-only Drive activity and Google Calendar.
const gmailScopes = [
  // "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send"
];
// Example on redirecting user to Google's OAuth 2.0 server.
const getGmailAuthURL = asyncHandler((req, res) => {
  const email = req.email;
  if (!email) {
    throw new APIError(404, "No Email found for Google Auth.");
  }
  const state = crypto.randomBytes(32).toString("hex");
  // Store state in the session
  req.session.state = state;
  req.session.emailForGoogleLink = email;

  req.session.save((err) => {
    console.log("Session saved with state for Google Auth");
    if (err) return res.status(500).json({ error: "Could not save session" });
  });

  // Generate a url that asks permissions for the Drive activity and Google Calendar scope
  const authorizationUrl = oauth2ClientGmail.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",
    /** Pass in the scopes array defined above.
     * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: gmailScopes,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true,
    // Include the state parameter to reduce the risk of CSRF attacks.
    state: state,
  });

  res.redirect(authorizationUrl);
});

export { getGmailAuthURL, gmailScopes ,oauth2ClientGmail};
