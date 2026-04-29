import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  sendVerificationEmail,
  sendSecurityCodeMail,
} from "../integrations/emails/email.resend.js";
import { oauth2Client } from "../integrations/Auth/auth.google.js";
import { oauth2ClientGmail } from "../integrations/Auth/gmail.google.js";
import url from "url";
import { google } from "googleapis";
import CryptoJS from "crypto-js";

//User Controllers

/**
 * Generates an access token and a refresh token for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{accessToken: string, refreshToken: string}>} An object containing the access and refresh tokens.
 * @throws {APIError} If something goes wrong during token generation.
 */
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // Save the new refresh token

    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      "Went Wrong while generating refresh and access token",
    );
  }
};

/**
 * Default cookies options.
 * - `secure` must only be true in production (HTTPS). Browsers won't accept
 *   secure cookies over plain HTTP during local development.
 * - `sameSite` is set to "None" in production to allow cross-site usage when
 *   frontend and backend are on different origins; in development we use
 *   "Lax" to improve compatibility.
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  domain:
    process.env.NODE_ENV === "production"
      ? process.env.COOKIE_DOMAIN
      : undefined,
};

/**
 * Generates a random 6-digit verification code.
 * @returns {string} The generated verification code.
 */
const genVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Checks the availability of an email address.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const checkEmailAvailability = asyncHandler(async (req, res) => {
  const encodedEmail = req.query.email;

  if (!encodedEmail) {
    throw new APIError(404, "Email is Required to check");
  }
  const decodedEmail = decodeURIComponent(encodedEmail);

  const foundUser = await User.findOne({ email: decodedEmail });

  if (foundUser) {
    return res.status(200).json({
      message: "This Email ID is Already Registered with Us",
      success: true,
      status: 200,
    });
  } else {
    return res.status(200).json({
      message: "Email ID is Available",
      success: true,
      status: 200,
    });
  }
});

/**
 * Registers a new user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const registerUser = asyncHandler(async (req, res) => {
  // Incoming registration payload from frontend.
  const { email, password } = req.body;

  // Validate input fields
  if ([email, password].some((field) => !field?.trim())) {
    throw new APIError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    // Block duplicate account creation for same email.
    throw new APIError(409, "User already exists");
  }

  const securityCode = genVerificationCode();
  const securityCodeExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  //Generating tempToken for Registeration Process
  const tempToken = jwt.sign(
    // Store only email in temp token for OTP verification step.
    { email }, // generating using email
    process.env.SECRET,
    { expiresIn: process.env.TEMP_TOKEN_EXPIRY },
  );

  //Adding Default Name
  const name = email.split(/[@.]/)[0];
  const username = email.split(/[@.]/).join("");

  // Create User
  const user = await User.create({
    // Auto-derived defaults for first-time local registration.
    name,
    email,
    password,
    username,
    securityCode,
    securityCodeExpiry,
  });

  // console.log("Registered User:", user); /// #DebugOnly #Remove Must

  // Fetch created user without sensitive data
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -inviteCode",
  );
  if (!createdUser) {
    throw new APIError(500, "Unable to retrieve user data after registration");
  }

  //Email Sending Using Resend
  try {
    // Send OTP/verification code to user's email inbox.
    await sendVerificationEmail(email, name, securityCode);
    console.log(`Verification email sent to ${email}`);
  } catch (err) {
    console.error(`Email sending failed: ${err.message}`);
    throw new APIError(
      500,
      "User registered but failed to send verification email",
    );
  }

  // Cookie options for tempToken (follow same env rules as `cookieOptions`)
  const tempTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 1000 * 60 * 15, // 15 min expiry for tempToken
    domain:
      process.env.NODE_ENV === "production"
        ? process.env.COOKIE_DOMAIN
        : undefined,
  };
  console.log("Regsiter Route End");
  return (
    res
      .status(201)
      // tempToken is required by /verifyemail to identify the pending user.
      .cookie("tempToken", tempToken, tempTokenCookieOptions)
      .json(
        new APIResponse(
          200,
          [],
          "User Registered Successfully. Verification Email Sent.",
        ),
      )
  );
});

/**
 * Checks the availability of a username.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const checkUsernameAvailability = asyncHandler(async (req, res) => {
  const encodedUsername = req.query.username;

  if (!encodedUsername) {
    throw new APIError(404, "Username is Required to check");
  }
  const decodedUsername = decodeURIComponent(encodedUsername);

  const foundUser = await User.findOne({ username: decodedUsername });

  if (foundUser) {
    return res.status(200).json({
      message: "This Username is Already Registered with Us",
      success: true,
      status: 200,
    });
  } else {
    return res.status(200).json({
      message: "Username is Available",
      success: true,
      status: 200,
    });
  }
});

/**
 * Verify the Email ID of User.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const verifyEmailID = asyncHandler(async (req, res) => {
  // Read short-lived cookie created during registration.
  const tempToken = req.cookies?.tempToken;

  if (!tempToken) {
    throw new APIError(404, "No temp cookie found for verification.");
  }
  // Decode temp token to resolve which account is being verified.
  const decodeToken = jwt.verify(tempToken, process.env.SECRET);

  const email = decodeToken.email;
  // OTP is expected as securityCode from client payload.
  const { securityCode } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new APIError(404, "User doesn't exist");
  }

  // Check if verification code is expired
  const isCodeValid =
    user.securityCodeExpiry && user.securityCodeExpiry > Date.now();
  if (!isCodeValid) {
    throw new APIError(400, `Verification code validity expired ${Date.now()}`);
  }

  // Check if verify code is correct & not expired
  if (user.securityCode === securityCode) {
    // Mark account verified and clear one-time verification fields.
    user.isVerified = true;
    user.securityCode = null;
    user.securityCodeExpiry = null;

    // Save changes to database
    await user.save({ validateBeforeSave: false }); // Set validateBeforeSave to false if verifyCode/Expiry are being unset

    return (
      res
        .status(200)
        // Clear tempToken after success so OTP flow cannot be replayed.
        .clearCookie("tempToken", cookieOptions)
        .json(new APIResponse(200, {}, "User is successfully verified"))
    );
  }
  throw new APIError(400, "Invalid verification code");
});

/**
 * Login with Email and Passwords.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const loginUser = asyncHandler(async (req, res) => {
  // Standard credential login payload.
  const { email, password } = req.body;

  if (!email || !password) {
    throw new APIError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new APIError(401, "Invalid email or user doesn't exist");
  }

  const isMatchPassword = await user.isPasswordCorrect(password);

  if (!isMatchPassword) {
    throw new APIError(401, "Invalid Password");
  }

  // Generate accessToken, refreshToken
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  // console.log("Login Route End", "Generated Tokens: ", { accessToken, refreshToken }); #DebugOnly
  console.log("Login Route End");
  return (
    res
      .status(200)
      // Set auth cookies for session-based API access.
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(new APIResponse(200, {}, "You are successfully Logged In "))
  );
});

/**
 * Logout User
 * Clears all authentication cookies and invalidates refresh token
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id; // Assuming you have jwtAuthMiddleware to set req.user

  if (userId) {
    // Optionally invalidate refresh token in DB
    await User.findByIdAndUpdate(
      userId,
      { refreshToken: null },
      { validateBeforeSave: false },
    );
  }

  // Clear cookies
  res
    // Remove all auth and temporary registration cookies.
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("tempToken", cookieOptions)
    .status(200)
    .json(new APIResponse(200, {}, "Successfully Logged Out"));
});

/**
 * Register/Login a new user using Google.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const registerUserGoogle = asyncHandler(async (req, res) => {
  try {
    // Log received session data for debugging
    // console.log("googleLink - req.session.state:", req.session?.state); #DebugOnly
    // console.log("googleLink - req.query.state:", req.query?.state);  #DebugOnly

    // Handle the OAuth 2.0 server response
    let q = url.parse(req.url, true).query;

    // console.log("url query received:", q);  #DebugOnly

    if (q.error) {
      // An error response e.g. error=access_denied
      console.error("Google OAuth Error:" + q.error);
      throw new APIError(400, `Google OAuth Error: ${q.error}`);
    }
    // CSRF State verification
    else if (q.state !== req.session.state) {
      // Reject callback if CSRF state does not match session value.
      // Verify state value
      console.error(
        "State mismatch. Possible CSRF attack. Expected:",
        req.session.state,
        "Received:",
        q.state,
      );
      throw new APIError(403, "State mismatch. Possible CSRF attack.");
    } else {
      // Exchange authorization code for Google tokens.
      // Get access and refresh tokens (if access_type is offline)
      let { tokens } = await oauth2Client.getToken(q.code);
      oauth2Client.setCredentials(tokens);

      // console.log("googleToken received:", tokens);  #DebugOnly

      const googleAccessToken = tokens?.access_token;

      oauth2Client.setCredentials({ access_token: googleAccessToken });

      const oauth2 = google.oauth2({
        version: "v2",
        auth: oauth2Client,
      });

      const userinfo = await oauth2.userinfo.get();
      // console.log(userinfo.data);  #DebugOnly

      const { email, name, picture, verified_email } = userinfo.data;

      const userData = {
        name,
        email,
        password: crypto.randomBytes(20).toString("hex"), // Generate a random password since it's required by the schema
        username: email.split(/[@.]/).join(""), //Create a username by removing special characters from email
        isVerified: verified_email,
      };

      const result = await User.findOneAndUpdate(
        { email: email }, // The condition to find the user
        {
          $set: {
            profileURL: picture,
          },
          $setOnInsert: userData,
        }, // The data to insert if the user doesn't exist
        {
          // Upsert means create the user on first Google login, otherwise update.
          upsert: true, // This creates the document if it doesn't exist
          new: true, // This returns the new document if created, or the existing one if found
          setDefaultsOnInsert: true, // Applies your schema's default values on creation
          includeResultMetadata: true, // Return the raw result from MongoDB to check if the document was created or found
        },
      );

      // console.log("Google OAuth User Upsert Result:", result); // #DebugOnly
      // console.log("Google OAuth User Upsert ResultValue:", result.value); // #DebugOnly
      // console.log("Google OAuth User Upsert ResultLastErrorObject:", result.lastErrorObject); // #DebugOnly
      const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(result.value._id);

      // const createdUser = await User.findById(user._id);  // #DebugOnly

      // console.log(createdUser,"ACC: ",accessToken); // #DebugOnly

      const user = result.value;
      let messageSuccess = "";

      if (result.lastErrorObject?.updatedExisting === false) {
        messageSuccess = "User Registered Successfully  with Google";
      } else {
        messageSuccess = "User Logged In Successfully";
      }

      return (
        res
          .status(200)
          // Persist local auth cookies after Google login/upsert.
          .cookie("accessToken", accessToken, cookieOptions)
          .cookie("refreshToken", refreshToken, cookieOptions)
          .redirect(
            `https://${process.env.FRONTEND_DOMAIN}/chats?message=${encodeURIComponent(messageSuccess)}`,
          )
      );
    }
  } catch (error) {
    console.error("Error In Google Linking:", error);
    // Redirect to a frontend error page with a helpful message
    const errorMessage =
      error instanceof APIError
        ? error.message
        : "An unexpected error occurred during Google linking.";
    const statusCode = error instanceof APIError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .redirect(
        `https://${process.env.FRONTEND_DOMAIN}/error?message=${encodeURIComponent(errorMessage)}`,
      );
  }
});

/**
 * Send Encrypted Email to frontend.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getEncryptedEmail = asyncHandler(async (req, res) => {
  // #Need to Remove
  const secret = process.env.SECRET;

  const accessToken = req.cookies?.accessToken;
  if (!accessToken) {
    throw new APIError(404, "No accessToken cookie found for Google Auth.");
  }
  const { email } = await jwt.verify(accessToken, secret);

  if (!email) {
    throw new APIError(400, "Email ID is required");
  }

  //Basic email format validation (optional)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new APIError(400, "Invalid email format");
  }

  const encryptedEmail = CryptoJS.AES.encrypt(email, secret).toString();
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        { email: encryptedEmail },
        "Successfully Encrypted Email for Googgle Auth",
      ),
    );
});

/**
 * Return current authenticated user (safe fields).
 */
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new APIError(401, "Unauthorized");
  }
  // req.user is already selected without password and refreshToken in auth middleware
  return res.status(200).json(new APIResponse(200, { user }, "User fetched"));
});

/**
 * Add Gmail Credentials to existing user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const gmailLink = asyncHandler(async (req, res) => {
  try {
    // Log received session data for debugging
    // console.log("googleLink - req.session.emailForGoogleLink:", req.session?.emailForGoogleLink );
    // console.log("googleLink - req.session.state:", req.session?.state);
    // console.log("googleLink - req.query.state:", req.query?.state);

    const email = req.session?.emailForGoogleLink; // Get email from session

    if (!email) {
      // Handle case where session data is missing or expired
      console.error(
        "gmailLink: Email not found in session. Session might be expired or not set.",
      );
      throw new APIError(
        401,
        "Session data missing for Google Gmail linking. Please try registering again.",
      );
    }

    // Handle the OAuth 2.0 server response
    let q = url.parse(req.url, true).query;

    // console.log("url query received:", q);

    if (q.error) {
      // An error response e.g. error=access_denied
      console.error("Google Gmail OAuth Error:" + q.error);
      throw new APIError(400, `Google Gmail OAuth Error: ${q.error}`);
    }
    // CSRF State verification
    else if (q.state !== req.session.state) {
      // CSRF protection for Gmail OAuth callback.
      // Verify state value
      console.error(
        "State mismatch. Possible CSRF attack. Expected:",
        req.session.state,
        "Received:",
        q.state,
      );
      throw new APIError(403, "State mismatch. Possible CSRF attack.");
    } else {
      // Exchange callback code for Gmail OAuth tokens.
      // Get access and refresh tokens (if access_type is offline)
      let { tokens } = await oauth2ClientGmail.getToken(q.code);
      oauth2ClientGmail.setCredentials(tokens);

      // console.log("googleToken received:", tokens); // #Only for Testing

      const googleRefreshToken = tokens?.refresh_token;
      const googleAccessToken = tokens?.access_token;

      if (!googleRefreshToken) {
        throw new APIError(
          405,
          "Google Refresh Token Not Found in Google Response",
        );
      }
      if (!googleAccessToken) {
        throw new APIError(
          405,
          "Google Access Token Not Found in Google Response",
        );
      }

      const user = await User.findOne({ email }); // Find user using email from session

      if (!user) {
        console.error(`User with email ${email} not found after Google OAuth.`);
        throw new APIError(
          404,
          "User not found in database for Google Gmail linking email.",
        );
      }

      // END OF SECTION

      user.googleRefreshToken = googleRefreshToken; //Saving Google Refresh Token in MongoDB
      user.googleConnected = true; // Mark that user has linked Google account

      const name = user.name;

      const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

      await user.save({ validateBeforeSave: false }); // saving to db

      // --- Clear session data after successful linking ---
      if (req.session) {
        // Cleanup OAuth temporary session data after success.
        req.session.emailForGoogleLink = undefined;
        req.session.state = undefined; // Clear CSRF state
        // req.session.destroy((err) => {
        //     if (err) console.error("Error destroying session:", err);
        // });
      }

      const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      };
      console.log("Linking Google Route End");
      return (
        res
          .status(200)
          // Issue fresh auth cookies and redirect with linked state.
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .redirect(`https://${process.env.FRONTEND_DOMAIN}/account?linked=true&message=${encodeURIComponent("Google account linked successfully")}`)
        );
    }
  } catch (error) {
    console.error("Error In Google Linking:", error);
    // Redirect to a frontend error page with a helpful message
    const errorMessage =
      error instanceof APIError
        ? error.message
        : "An unexpected error occurred during Google linking.";
    const statusCode = error instanceof APIError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .redirect(
        `https://${process.env.FRONTEND_DOMAIN}/account?linked=false&message=${encodeURIComponent(errorMessage)}`,
      );
  }
});

/**
 * Sends Security code for Critical Actions(Logged Only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const sendSecurityCodeLogged = asyncHandler(async (req, res) => {
  // req.user comes from auth middleware; only logged users can use this route.
  const user = req.user; // middleware incoming

  // console.log(user); #DebugOnly

  const email = user.email;
  const name = user.name;

  // Generate verification code
  const verifyCodeGen = genVerificationCode();
  const verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  user.securityCode = verifyCodeGen;
  user.securityCodeExpiry = verifyCodeExpiry;

  await user.save({ validateBeforeSave: false }); // Save code in DB

  // Sending verification email
  try {
    await sendSecurityCodeMail(email, name, verifyCodeGen);
    console.log(`Security code email sent to ${email}`);
  } catch (err) {
    console.error(`Email sending failed: ${err.message}`);
    throw new APIError(500, "Security code failed email");
  }
  console.log("Send Security Code Route End");
  return res
    .status(200)
    .json(new APIResponse(200, {}, "Security Code sent Successfully"));
});

/**
 * Sends Security code for Password Forget.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const sendSecurityCodeForgetPassword = asyncHandler(async (req, res) => {
  const email = req.body?.email;

  if (!email) {
    throw new APIError(400, "Email is required");
  }

  // 1. Check for existing reset token to track attempts
  const existingToken = req.cookies?.token_reset;
  let currentCnt = 3; // Default for first-time request

  if (existingToken) {
    try {
      const decoded = jwt.verify(existingToken, process.env.SECRET);

      // Safety check: ensure the email matches the token
      if (decoded.email !== email) {
        throw new APIError(400, "Invalid session for this email");
      }

      currentCnt = decoded.cnt;

      // 2. Check if attempts are exhausted
      if (currentCnt <= 0) {
        throw new APIError(
          429,
          "Too many attempts. Please try again after 1 hour.",
        );
      }
    } catch (err) {
      // If token is expired, we let them start over with a fresh 3 attempts
      // or you can handle expiration more strictly based on your security policy.
      currentCnt = 3;
    }
  }

  const user = await User.findOne({ email: String(email) });
  if (!user) {
    throw new APIError(404, "User with this email doesn't exist");
  }

  // 3. Generate new code and save to User
  const verifyCodeGen = genVerificationCode();
  const verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.securityCode = verifyCodeGen;
  user.securityCodeExpiry = verifyCodeExpiry;
  await user.save({ validateBeforeSave: false });

  // 4. Create NEW token with decremented count
  // We subtract 1 from the current count
  const nextCnt = currentCnt - 1;
  const token_reset = jwt.sign({ email, cnt: nextCnt }, process.env.SECRET, {
    expiresIn: process.env.TEMP_TOKEN_EXPIRY,
  });

  try {
    await sendVerificationEmail(email, user.name, verifyCodeGen);
  } catch (err) {
    throw new APIError(500, "Failed to send email");
  }

  // 5. Return response with the updated cookie
  return res
    .status(200)
    .cookie("token_reset", token_reset, cookieOptions)
    .json(
      new APIResponse(
        200,
        { attemptsLeft: nextCnt },
        "Security Code sent successfully",
      ),
    );
});

/**
 * Password Reset.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const passwordReset = asyncHandler(async (req, res) => {
  const secret = process.env.SECRET;

  const accessToken = req.cookies?.accessToken;

  const emailtkn = req.cookies?.token_reset; // token for password forget initiation

  if (!accessToken && !emailtkn) {
    if (!emailtkn) {
      throw new APIError(404, "No token found for password reset initiation.");
    } else {
      throw new APIError(
        404,
        "No accessToken cookie found for password reset.",
      );
    }
  }

  let email;

  try {
    if (accessToken) {
      const decoded = jwt.verify(accessToken, secret);
      email = decoded.email;
    } else if (emailtkn) {
      const decoded = jwt.verify(emailtkn, secret);
      email = decoded.email;
    }
  } catch (err) {
    throw new APIError(401, "Invalid or expired token");
  }

  if (!email) {
    throw new APIError(400, "Email ID is required");
  }

  const { password, securityCode } = req.body;

  const freshUser = await User.findOne({ email });

  if (!freshUser) {
    throw new APIError(400, "User not found");
  }

  // Retrieve stored expiry from DB
  const isCodeValid =
    freshUser.securityCodeExpiry && freshUser.securityCodeExpiry > Date.now();
  if (!isCodeValid) {
    throw new APIError(400, "Verification code validity expired");
  }

  // Verify if entered code matches stored code
  if (freshUser.securityCode !== securityCode) {
    // Prevent reset when provided OTP is wrong.
    throw new APIError(400, "Invalid verification code");
  }

  // Updated password
  freshUser.password = password;
  // Invalidate OTP after successful password update.
  freshUser.securityCode = null; // Removed verification code after use
  freshUser.securityCodeExpiry = null;

  await freshUser.save({ validateBeforeSave: false });
  console.log("Password Reset Route End");
  return res
    .status(200)
    .json(new APIResponse(200, {}, "Password changed successfully"));
});

/**
 * Profile Update.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const profileUpdate = asyncHandler(async (req, res) => {
  
  const user = req.user;

  if (!user) {
    throw new APIError(403, "Unauthorized Access.");
  }

  let { name, profileURL, username } = req.body;

  name = name || user.name;
  profileURL = profileURL || user.profileURL;
  username = username || user.username;

  user.name = name;
  user.profileURL = profileURL;
  user.username = username;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new APIResponse(200, {}, "Profile Updated Successfully")
  );
});

export {
  registerUser,
  checkEmailAvailability,
  checkUsernameAvailability,
  verifyEmailID,
  sendSecurityCodeLogged,
  sendSecurityCodeForgetPassword,
  passwordReset,
  loginUser,
  logoutUser,
  registerUserGoogle,
  getEncryptedEmail,
  gmailLink,
  getMe,
  profileUpdate
};
