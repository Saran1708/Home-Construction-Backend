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
  const firstName = name.split(" ")[0];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:4px;padding:40px 48px;">
          <tr>
            <td style="padding-bottom:24px;border-bottom:1px solid #eeeeee;">
              <p style="margin:0;font-size:13px;color:#999999;letter-spacing:1px;text-transform:uppercase;">${fromName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#222222;line-height:1.7;">Hi ${firstName},</p>
              <p style="margin:0 0 20px;font-size:16px;color:#222222;line-height:1.7;">
                Thank you for your purchase. Your Home Construction Blueprint ebook bundle is ready &mdash; you can download it using the link below.
              </p>
              <p style="margin:0 0 28px;">
                <a href="${downloadLink}" style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:4px;">
                  Download Your Ebooks
                </a>
              </p>
              <p style="margin:0 0 8px;font-size:15px;color:#444444;line-height:1.7;">Your bundle includes:</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                ${[
                  "RCC &amp; Foundation Guide",
                  "Brickwork &amp; Plastering",
                  "Plumbing &amp; Water Systems",
                  "Tile &amp; Granite Selection Guide",
                  "Contractor Agreement &amp; Payment Terms"
                ].map(book => `
                <tr>
                  <td style="padding:4px 0;font-size:15px;color:#444444;line-height:1.7;">
                    &mdash;&nbsp;${book}
                  </td>
                </tr>`).join("")}
              </table>
              <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.7;">
                If you have any trouble accessing the files, just reply to this email and I'll help you out.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#444444;line-height:1.7;">
                Thank you again for your order.
              </p>
              <p style="margin:0;font-size:15px;color:#222222;line-height:1.7;">
                Warm regards,<br/>
                <strong>${fromName}</strong><br/>
                <span style="color:#888888;font-size:13px;">${fromEmail}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;border-top:1px solid #eeeeee;margin-top:32px;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                Order ID: ${orderId}<br/>
                &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
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
    subject: "Your Home Construction Blueprint Ebooks",
    html,
    text: `Hi ${firstName},\n\nThank you for your purchase. Your Home Construction Blueprint ebook bundle is ready to download.\n\nDownload link: ${downloadLink}\n\nYour bundle includes:\n- RCC & Foundation Guide\n- Brickwork & Plastering\n- Plumbing & Water Systems\n- Tile & Granite Selection Guide\n- Contractor Agreement & Payment Terms\n\nIf you have any trouble, just reply to this email.\n\nWarm regards,\n${fromName}\n\nOrder ID: ${orderId}`,
  });

  logger.info(`📧 Email sent to ${to} for order ${orderId}`);
};