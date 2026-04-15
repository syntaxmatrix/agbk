import {ProductName} from "../../constant.js"

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
        <!-- container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.08);">
          
          <!-- header -->
          <tr>
            <td style="background: linear-gradient(90deg, #3D5A80 0%, #2f4763 100%); padding:20px 24px; text-align:left;">
              <h1 style="margin:0; color:#fff; font-size:20px; letter-spacing:0.2px; text-align: center;">${ProductName}</h1>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:28px 24px; text-align:left; color:#333;">
              <p style="margin:0 0 12px 0; font-size:16px;">Hi <strong>${name}</strong>,</p>

              <p style="margin:0 0 18px 0; font-size:15px; color:#555;">
                Use the verification code below to verify your email address.
              </p>
              <div style="text-align: center;">
              <div style="display:inline-block; padding:16px 22px; border-radius:8px; font-size:22px; font-weight:700; letter-spacing:2px; background:#eef3f8; color:#1d2b3d; border:2px dashed #3D5A80; margin:12px 0;">
                ${verifyCode}
              </div>
              </div>
              <p style="margin:18px 0 8px 0; font-size:14px; color:#666;">
                This code is valid for <strong>1 hour</strong>. If you didn't request this, you can ignore this email.
              </p>

              <p style="margin:0; font-size:14px; color:#666;">
                Need help? Reply to this email and our team will assist you.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa; padding:16px 24px; font-size:12px; color:#888; text-align:center;">
              <div style="margin-bottom:6px;">${ProductName}  — keeping your account safe</div>
              <div>If you did not request this, you can safely ignore this message.</div>
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
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="background: linear-gradient(90deg, #2A9D8F 0%, #264653 100%); padding:30px 24px; text-align:center;">
              <h1 style="margin:0; color:#fff; font-size:24px; letter-spacing:1px;">Welcome to ${ProductName}!</h1>
              <p style="margin:10px 0 0 0; color:#e9edc9; font-size:14px; text-transform: uppercase; font-weight: bold;">Registration Successful</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 24px; text-align:left; color:#333;">
              <p style="margin:0 0 12px 0; font-size:16px;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 20px 0; font-size:15px; color:#555; line-height:1.6;">
                Thanks for joining us! We’re thrilled to have you onboard. Your account is now active, and you have exclusive access to our <strong>Beta Version</strong>.
              </p>

              <div style="background:#f8f9fa; border-left:4px solid #2A9D8F; padding:16px; margin-bottom:20px;">
                <h3 style="margin:0 0 10px 0; font-size:16px; color:#264653;">🚀 What's available in Beta?</h3>
                <ul style="margin:0; padding-left:20px; font-size:14px; color:#444; line-height:1.8;">
                  <li><strong>Gmail Send Automation:</strong> Connect your workspace and automate your outbound workflows seamlessly.</li>
                  <li><strong>General Query Engine:</strong> Use our AI-driven interface to process natural language queries instantly.</li>
                
                </ul>
              </div>

              <p style="margin:0 0 20px 0; font-size:15px; color:#555; line-height:1.6;">
                As a Beta user, your feedback is our most valuable asset. If you encounter any bugs or have ideas for new features, we’d love to hear them.
              </p>


              <p style="margin:20px 0 0 0; font-size:14px; color:#666;">
                Questions? Just reply to this email. Our dev team is always around to help.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#fafafa; padding:20px 24px; font-size:12px; color:#888; text-align:center; border-top:1px solid #eeeeee;">
              <div style="margin-bottom:8px;"><strong>${ProductName}</strong> — Automating the Future</div>
              <div>You are receiving this because you signed up for the ${ProductName} Beta program.</div>
              <div style="margin-top:10px;">
                <a href="#" style="color:#2A9D8F; text-decoration:none;">Unsubscribe</a> • <a href="#" style="color:#2A9D8F; text-decoration:none;">Privacy Policy</a>
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
          
          <tr>
            <td style="background: linear-gradient(90deg, #EE6C4D 0%, #d15a3d 100%); padding:20px 24px; text-align:left;">
              <h1 style="margin:0; color:#fff; font-size:20px; letter-spacing:0.2px; text-align: center;">Security Center</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 24px; text-align:left; color:#333;">
              <p style="margin:0 0 12px 0; font-size:16px;">Hello <strong>${name}</strong>,</p>

              <p style="margin:0 0 18px 0; font-size:15px; color:#555; line-height: 1.5;">
                We received a request to update important information on your account. Please use the following <strong>security code</strong> to authorize these changes:
              </p>
              
              <div style="text-align: center;">
                <div style="display:inline-block; padding:16px 30px; border-radius:8px; font-size:28px; font-weight:700; letter-spacing:4px; background:#fffaf0; color:#EE6C4D; border:2px solid #EE6C4D; margin:12px 0;">
                  ${securityCode}
                </div>
              </div>

              <p style="margin:18px 0 12px 0; font-size:14px; color:#c0392b; font-weight: 600;">
                ⚠️ For your protection, do not share this code with anyone. 
              </p>

              <p style="margin:0 0 18px 0; font-size:14px; color:#666;">
                This code expires in <strong>10 minutes</strong>. If you did not attempt to update your account, please change your password immediately and contact support.
              </p>

              <p style="margin:0; font-size:14px; color:#666;">
                Stay safe, <br>${ProductName}
              </p>
            </td>
          </tr>

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
