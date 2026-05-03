import { Router } from "express";
import {
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
  getMe,
  gmailLink,
  profileUpdate,
} from "../controllers/user.controller.js";
import { getGoogleAuthURL } from "../integrations/Auth/auth.google.js";
import { getGmailAuthURL } from "../integrations/Auth/gmail.google.js";
import { getEmail } from "../middlewares/email.js";
import { auth_middleware } from "../middlewares/auth.js";
import { verifyTurnstile } from "../middlewares/turnstile.js";

const router = Router();

// ## Unsecured Routes #Starts

//Email Availbility Check
router.route("/emailavailability").get(checkEmailAvailability); // example.com/api/v1/user/emailavailability?email=mail@agent.com

//Username Availbility Check
router.route("/usernameavailability").get(checkUsernameAvailability); // example.com/api/v1/user/usernameavailabilityusername=rahul

// REGISTER USER
router.route("/register").post(verifyTurnstile, registerUser); // example.com/api/v1/user/register

// LOGIN USER
router.route("/login").post(verifyTurnstile, loginUser); // example.com/api/v1/user/login

// Request Security Code(OTP) for Forget Password Only
router.route("/otp").post(verifyTurnstile, sendSecurityCodeForgetPassword); // example.com/api/v1/user/otp

// ## Unsecured Routes #Ends

//#Semi-Secured Route #Starts

// VERIFY EMAIL ID
router.route("/verifyemail").post(verifyEmailID); // example.com/api/v1/user/verifyemail

// GOOGLE OAUTH2 LOGIN
router.route("/google").get(getGoogleAuthURL); // example.com/api/v1/user/google

// Google OAuth2 callback route
router.route("/google/callback").get(registerUserGoogle); // example.com/api/v1/user/google/callback

// PASSWORD RESET
router.route("/passwordreset").post(verifyTurnstile, passwordReset); // example.com/api/v1/user/passwordreset

//#Semi-Secured Route #Ends

// ## Secured Routes #Starts

// LOGOUT USER
router.route("/logout").post(auth_middleware, logoutUser); // example.com/api/v1/user/logout

// Get current authenticated user
router.route("/me").get(auth_middleware, getMe); // example.com/api/v1/user/me

// Update user profile
router.route("/updatedprofile").put(auth_middleware, profileUpdate); // example.com/api/v1/user/updatedprofile

// SEND SECURITY CODE(OTP) TO LOGGED-IN USER for Sensitive Actions (like password change, etc.)
router
  .route("/requestsecuritycode")
  .post(auth_middleware, sendSecurityCodeLogged); // example.com/api/v1/user/requestsecuritycode

// ## GOOGLE GMAIL OAUTH2 #Starts
//Step 0: EMAIL ENCRYPTION FOR GOOGLE GMAIL OAUTH2
router.route("/email").get(auth_middleware, getEncryptedEmail); // example.com/api/v1/user/email returns encryptedEmailFromFrontend

//Step 1: GOOGLE GMAIL OAUTH2 LOGIN
router.route("/gmail").get(auth_middleware, getEmail, getGmailAuthURL); // example.com/api/v1/user/gmail?email=encodedEmail(encryptedEmailFromFrontend)

// Step 2: GOOGLE GMAIL OAUTH2 CALLBACK
router.route("/gmail/callback").get(auth_middleware, gmailLink); // example.com/api/v1/user/gmail/callback

// ## Secured Routes #Ends

export default router;
