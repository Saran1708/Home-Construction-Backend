import nodemailer from "nodemailer";
import { logger } from "./logger.js";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 465,
      secure: process.env.MAIL_SECURE === "true",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
    logger.info(`📬 Mailer init: ${process.env.MAIL_HOST}`);
  }
  return transporter;
};

export const sendEbookEmail = async ({ to, name, orderId }) => {
  const downloadLink = process.env.EBOOK_DRIVE_LINK;
  const fromName = process.env.MAIL_FROM_NAME;
  const fromEmail = process.env.MAIL_FROM_EMAIL;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">

          <!-- Brand bar -->
          <tr>
            <td style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:22px 36px;border-bottom:1px solid #2e2e2e;">
              <p style="margin:0;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#ede8df;font-weight:600;">
                ${fromName}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#141414;padding:44px 36px 40px;">
              <div style="width:40px;height:2px;background:#ede8df;margin-bottom:28px;"></div>
              <h1 style="margin:0 0 12px;font-size:26px;font-weight:600;color:#f5f5f5;line-height:1.3;">
                Your Ebooks Are Ready! 🏗️
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#8c8c8c;line-height:1.7;">
                Hi <strong style="color:#c9bfad;">${name}</strong>, thank you for your purchase!
                Your Home Construction Blueprint bundle is ready to download.
              </p>

              <!-- Download Button -->
              <a href="${downloadLink}"
                 style="display:inline-block;padding:14px 32px;background:#ede8df;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1.5px;border-radius:6px;text-transform:uppercase;">
                📥 Download Your Ebooks &rarr;
              </a>

              <!-- Ebook list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td style="background:#1a1a1a;border:1px solid #2e2e2e;border-radius:10px;padding:24px;">
                    <p style="margin:0 0 14px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8c8c8c;font-weight:500;">
                      What's included
                    </p>
                    ${["RCC & Foundation Guide","Brickwork & Plastering","Plumbing & Water Systems","Tile & Granite Selection Guide","Contractor Agreement & Payment Terms"].map(b => `<p style="margin:0 0 8px;font-size:14px;color:#c9bfad;">✅ &nbsp;${b}</p>`).join("")}
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 4px;font-size:12px;color:#8c8c8c;">Order ID:</p>
              <p style="margin:0 0 24px;font-size:13px;font-family:monospace;color:#ede8df;">${orderId}</p>
              <p style="margin:0;font-size:13px;color:#8c8c8c;line-height:1.6;">
                Having trouble downloading? Just reply to this email and we will sort it out.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;border-radius:0 0 12px 12px;padding:24px 36px;text-align:center;border-top:1px solid #2e2e2e;">
              <p style="margin:0;font-size:12px;color:#8c8c8c;line-height:1.6;">
                © ${new Date().getFullYear()} ${fromName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await getTransporter().sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${name}" <${to}>`,
    subject: "Your Home Construction Blueprint Ebooks Are Ready!",
    html,
    text: `Hi ${name}, your ebook bundle is ready! Download here: ${downloadLink} | Order ID: ${orderId}`,
  });

  logger.info(`📧 Email sent to ${to} for order ${orderId}`);
};