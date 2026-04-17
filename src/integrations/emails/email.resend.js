import { Resend } from "resend";
import {
  generateVerificationEmailHTML,
  generateWelcomeEmailHTML,
  generateSecurityEmailHTML,
} from "./email.html.js";
import { APIError } from "../../utils/APIError.js";
import { emailnoreply, ProductName } from "../../constant.js";

const RESENDKEY = process.env.RESEND_API_KEY;

if (!RESENDKEY) {
  throw new Error(
    "RESEND_API_KEY is not set. Please set RESEND_API_KEY in your .env",
  );
}

// Initialize Resend client with the API key
const resend = new Resend(RESENDKEY);

// Function to send a verification email
const sendVerificationEmail = async (email, name, verifyCode) => {
  // Email HTML template
  const emailHTML = generateVerificationEmailHTML(name, verifyCode);

  try {
    const result = await resend.emails.send({
      from: `${ProductName} <${emailnoreply}>`,
      to: [email],
      subject: `${ProductName} | Verification Code`,
      html: emailHTML,
    });

    return { message: "OTP sent successfully", email, result };
  } catch (err) {
    console.error("Resend send error:", err);
    throw new APIError(500, `Failed to send email: ${err.message}`);
  }
};

// Function to send Security code for password reset Only.
// Function to send a verification email
const sendSecurityCodeMail = async (email, name, verifyCode) => {
  // Email HTML template
  const emailHTML = generateSecurityEmailHTML(name, verifyCode);

  try {
    const { data, error } = await resend.emails.send({
      from: `${ProductName} <${emailnoreply}>`,
      to: [email],
      subject: `${ProductName} | Security Code`,
      html: emailHTML,
    });

    if (error) {
      throw new APIError(500, error.message);
    }

    return { message: "OTP sent successfully", email };
  } catch (err) {
    throw new APIError(500, `Failed to send email: ${err.message}`);
  }
};

// Function to send a primary user success email
const sendWelcomeEmail = async (email, name) => {
  // Email HTML template
  const emailHTML = generateWelcomeEmailHTML(name);

  try {
    const { data, error } = await resend.emails.send({
      from: `${ProductName} <${emailnoreply}>`,
      to: [email],
      subject: `${ProductName} | Successful Registration`,
      html: emailHTML,
    });

    if (error) {
      throw new APIError(500, error.message);
    }

    return { message: "registration/welcome email sent successfully", email };
  } catch (err) {
    throw new APIError(
      500,
      `Failed to send to user welcome email: ${err.message}`,
    );
  }
};

export { sendVerificationEmail, sendWelcomeEmail, sendSecurityCodeMail };
