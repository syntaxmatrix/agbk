import { ProductName, emailSupport } from "../../constant.js";

const generateVerificationEmailHTML = (name, verifyCode) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Email Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.08);">
          
          <!-- 1:4 Ratio Top Banner -->
          <tr>
            <td style="background:#182233; padding:30px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                <tr>
                  <!-- Left Column: Logo -->
                  <td width="20%" style="text-align:left; vertical-align:middle;">
                    <img 
                      src="https://res.cloudinary.com/rs14jr/image/upload/v1777484925/android-chrome-512x512_qrfkmd.png" 
                      alt="${ProductName} Logo" 
                      width="64" 
                      height="64"
                      style="display:block; border-radius:12px;"
                    />
                  </td>
                  
                  <!-- Right Column: Text -->
                  <td width="80%" style="text-align:left; vertical-align:middle; padding-left:15px;">
                    <h1 style="margin:0; color:#fff; font-size:24px; letter-spacing:0.5px;">
                      Welcome to ${ProductName}!
                    </h1>
                    <p style="margin:10px 0 0 0; color:#cbd5f5; font-size:13px; text-transform: uppercase; font-weight:600;">
                      Action Required: Verify Email
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:28px 24px; text-align:left; color:#333;">
              <p style="margin:0 0 12px 0; font-size:16px;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="margin:0 0 18px 0; font-size:15px; color:#555;">
                Use the verification code below to verify your email address.
              </p>

              <div style="text-align: center;">
                <!-- Updated border & colors to match the new #182233 header theme -->
                <div style="display:inline-block; padding:16px 22px; border-radius:8px; font-size:24px; font-weight:700; letter-spacing:4px; background:#f0f4f8; color:#182233; border:2px dashed #182233; margin:12px 0;">
                  ${verifyCode}
                </div>
              </div>

              <p style="margin:18px 0 8px 0; font-size:14px; color:#666;">
                This code is valid for <strong>1 hour</strong>. If you didn't request this, you can ignore this email.
              </p>

              <p style="margin:0; font-size:14px; color:#666;">
                Need help? Contact our support team at 
                <a href="mailto:${emailSupport}" style="color:#182233; text-decoration:none; font-weight:600;">
                  ${emailSupport}
                </a>
              </p>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="background:#fafafa; padding:16px 24px; font-size:12px; color:#888; text-align:center;">
              <div style="margin-bottom:6px;">
                ${ProductName} — keeping your account safe
              </div>
              <div>
                If you did not request this, you can safely ignore this message.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const generateWelcomeEmailHTML = (name) => {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Welcome to ${ProductName}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
  <td style="background:#182233; padding:30px 24px;">
    <!-- Nested table for 1:4 column layout -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
      <tr>
        <!-- Left Column: Logo (1 part / 20%) -->
        <td width="20%" style="text-align:left; vertical-align:middle;">
          <img 
            src="https://res.cloudinary.com/rs14jr/image/upload/v1777484925/android-chrome-512x512_qrfkmd.png" 
            alt="${ProductName} Logo" 
            width="64" 
            height="64"
            style="display:block; border-radius:12px;"
          />
        </td>
        
        <!-- Right Column: Text (4 parts / 80%) -->
        <td width="80%" style="text-align:left; vertical-align:middle; padding-left:15px;">
          <h1 style="margin:0; color:#fff; font-size:24px; letter-spacing:0.5px;">
            Welcome to ${ProductName}!
          </h1>
          <p style="margin:10px 0 0 0; color:#cbd5f5; font-size:13px; text-transform: uppercase; font-weight:600;">
            Registration Successful
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 24px; text-align:left; color:#333;">
          
          <p style="margin:0 0 12px 0; font-size:16px;">
            Hi <strong>${name}</strong>,
          </p>

          <p style="margin:0 0 18px 0; font-size:15px; color:#555; line-height:1.6;">
            Thanks for joining <strong>${ProductName}</strong>! We’re excited to have you onboard during our early <strong>beta phase</strong>.
          </p>

          <!-- Beta Access Info -->
          <div style="background:#f8f9fa; border-left:4px solid #182233; padding:16px; margin-bottom:20px;">
            <h3 style="margin:0 0 10px 0; font-size:16px; color:#182233;">🚀 Beta Access Information</h3>
            <p style="margin:0; font-size:14px; color:#444; line-height:1.7;">
              You are currently registered as a <strong>Free User</strong>.  
              Due to operational constraints as a growing startup, access to our AI agents is limited during this beta phase.
            </p>
          </div>

          <!-- Access CTA -->
          <div style="background:#fff7ed; border:1px solid #fde68a; padding:16px; border-radius:6px; margin-bottom:20px;">
            <p style="margin:0 0 10px 0; font-size:14px; color:#92400e; font-weight:600;">
              🔐 Want full access?
            </p>
            <p style="margin:0; font-size:14px; color:#78350f; line-height:1.6;">
              If you'd like to unlock access to our AI agents, simply reach out to us at:
            </p>
            <p style="margin:10px 0 0 0;">
              <a href="mailto:${emailSupport}" style="color:#2563eb; text-decoration:none; font-weight:600;">
                ${emailSupport}
              </a>
            </p>
          </div>

          <!-- Features -->
          <div style="background:#f8fafc; border-left:4px solid #2A9D8F; padding:16px; margin-bottom:20px;">
            <h3 style="margin:0 0 10px 0; font-size:16px; color:#264653;">✨ Platform Capabilities</h3>
            <ul style="margin:0; padding-left:20px; font-size:14px; color:#444; line-height:1.8;">
              <li><strong>AI Query Engine:</strong> Interact with intelligent responses using natural language.</li>
              <li><strong>Automation Tools:</strong> Seamlessly integrate workflows (available with access).</li>
            </ul>
          </div>

          <p style="margin:0 0 16px 0; font-size:14px; color:#555; line-height:1.6;">
            As an early user, your feedback is extremely valuable. Feel free to share suggestions or report issues anytime.
          </p>

          <p style="margin:20px 0 0 0; font-size:14px; color:#666;">
            Need help? Contact us at 
            <a href="mailto:${emailSupport}" style="color:#2563eb; text-decoration:none; font-weight:600;">
              ${emailSupport}
            </a>
          </p>

          <p style="margin-top:25px;">
            Best regards,<br/>
            <strong>Team ${ProductName}</strong>
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#fafafa; padding:20px 24px; font-size:12px; color:#888; text-align:center; border-top:1px solid #eeeeee;">
          <div style="margin-bottom:8px;"><strong>${ProductName}</strong> — Building the Future of AI Automation</div>
          <div>You are receiving this because you signed up for the ${ProductName} Beta program.</div>
          <div style="margin-top:10px;">
            <a href="https://www.syntx.in/terms" style="color:#2563eb; text-decoration:none;">Terms of Services</a> • 
            <a href="https://www.syntx.in/privacy" style="color:#2563eb; text-decoration:none;">Privacy Policy</a>
          </div>
        </td>
      </tr>

    </table>
  </td>
</tr>
  </table>
</body>
</html>
  `;
};

const generateSecurityEmailHTML = (name, securityCode) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Security Update Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.08);">
          
          <!-- 1:4 Ratio Top Banner -->
          <tr>
            <td style="background:#182233; padding:30px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                <tr>
                  <!-- Left Column: Logo -->
                  <td width="20%" style="text-align:left; vertical-align:middle;">
                    <img 
                      src="https://res.cloudinary.com/rs14jr/image/upload/v1777484925/android-chrome-512x512_qrfkmd.png" 
                      alt="${ProductName} Logo" 
                      width="64" 
                      height="64"
                      style="display:block; border-radius:12px;"
                    />
                  </td>
                  
                  <!-- Right Column: Text -->
                  <td width="80%" style="text-align:left; vertical-align:middle; padding-left:15px;">
                    <h1 style="margin:0; color:#fff; font-size:24px; letter-spacing:0.5px;">
                      ${ProductName}
                    </h1>
                    <p style="margin:10px 0 0 0; color:#cbd5f5; font-size:13px; text-transform: uppercase; font-weight:600;">
                      Security Center
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:28px 24px; text-align:left; color:#333;">
              <p style="margin:0 0 12px 0; font-size:16px;">
                Hello <strong>${name}</strong>,
              </p>

              <p style="margin:0 0 18px 0; font-size:15px; color:#555; line-height: 1.5;">
                We received a request to update important information on your account. Please use the following <strong>security code</strong> to authorize these changes:
              </p>
              
              <div style="text-align: center;">
                <div style="display:inline-block; padding:16px 30px; border-radius:8px; font-size:28px; font-weight:700; letter-spacing:4px; background:#fffaf0; color:#EE6C4D; border:2px solid #EE6C4D; margin:12px 0;">
                  ${securityCode}
                </div>
              </div>

              <p style="margin:18px 0 12px 0; font-size:14px; color:#c0392b; font-weight:600;">
                ⚠️ For your protection, do not share this code with anyone.
              </p>

              <p style="margin:0 0 18px 0; font-size:14px; color:#666;">
                This code expires in <strong>10 minutes</strong>. If you did not attempt to update your account, please change your password immediately and contact support.
              </p>

              <p style="margin:0 0 16px 0; font-size:14px; color:#666;">
                Need help? Contact our support team at 
                <a href="mailto:${emailSupport}" style="color:#EE6C4D; text-decoration:none; font-weight:600;">
                  ${emailSupport}
                </a>
              </p>

              <p style="margin:0; font-size:14px; color:#666;">
                Stay safe, <br>${ProductName}
              </p>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="background:#fafafa; padding:16px 24px; font-size:12px; color:#888; text-align:center;">
              <div style="margin-bottom:6px;"><strong>${ProductName}</strong> — Automation and AI</div>
              <div>This is an automated notification regarding your account security.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export {
  generateVerificationEmailHTML,
  generateWelcomeEmailHTML,
  generateSecurityEmailHTML,
};
