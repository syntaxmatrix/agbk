import { google } from "googleapis";
import crypto from "crypto";
import { asyncHandler } from "../../utils/asyncHandler.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// Access scopes for two non-Sign-In scopes: Read-only Drive activity and Google Calendar.
const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
];
// Example on redirecting user to Google's OAuth 2.0 server.
const getGoogleAuthURL = asyncHandler((req, res) => {
  // Generate a secure random state value.
  const state = crypto.randomBytes(32).toString("hex");
  // Store state in the session
  req.session.state = state;

  // Generate a url that asks permissions for the Drive activity and Google Calendar scope
  const authorizationUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "online",
    /** Pass in the scopes array defined above.
     * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: scopes,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true,
    // Include the state parameter to reduce the risk of CSRF attacks.
    state: state,
  });

  res.redirect(authorizationUrl);
});

export { getGoogleAuthURL, oauth2Client, scopes };
