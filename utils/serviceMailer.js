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
    logger.info(`📬 Service Mailer init: ${process.env.MAIL_HOST}`);
  }
  return transporter;
};

const SERVICE_META = {
  elevation: {
    label: "Elevation Makeover",
    delivery: "48 hours",
    description: "Our architect will design your home's exterior elevation and send it to your email.",
    whatNext: [
      "Our architect reviews your photos and requirements",
      "A custom front elevation design is created for your home",
      "You receive the final design to your email within 48 hours",
    ],
  },
  floorplan: {
    label: "House Plan (Floor Plan)",
    delivery: "48 hours",
    description: "Our team will draft a detailed floor plan layout based on your requirements.",
    whatNext: [
      "Our architect studies your plot dimensions and needs",
      "A complete floor plan is drawn up for your home",
      "You receive the final plan to your email within 48 hours",
    ],
  },
  interior: {
    label: "Interior Makeover",
    delivery: "48 hours",
    description: "Our designer will create an interior design concept for your space.",
    whatNext: [
      "Our interior designer reviews your photos and space",
      "A custom interior design concept is prepared",
      "You receive the design to your email within 48 hours",
    ],
  },
};

export const sendServiceConfirmationEmail = async ({ to, name, orderId, plan }) => {
  const fromName = process.env.MAIL_FROM_NAME;
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  const firstName = name.split(" ")[0];
  const meta = SERVICE_META[plan] || SERVICE_META.elevation;

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
                Thank you for your order! We've received your payment for the
                <strong> ${meta.label}</strong> service.
              </p>

              <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.7;">
                ${meta.description}
              </p>

              <p style="margin:0 0 12px;font-size:15px;color:#444444;line-height:1.7;font-weight:600;">Here's what happens next:</p>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                ${meta.whatNext.map((step, i) => `
                <tr>
                  <td style="padding:5px 0;vertical-align:top;">
                    <span style="font-size:13px;color:#ffffff;background:#1a1a1a;border-radius:50%;display:inline-block;width:20px;height:20px;text-align:center;line-height:20px;font-weight:700;margin-right:10px;">${i + 1}</span>
                  </td>
                  <td style="padding:5px 0;font-size:15px;color:#444444;line-height:1.7;">
                    ${step}
                  </td>
                </tr>`).join("")}
              </table>

              <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.7;">
                Expected delivery: <strong style="color:#222222;">within ${meta.delivery}</strong> of your order.
              </p>

              <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.7;">
                We'll send the design directly to this email address, so keep an eye on your inbox.
                If you don't see it within the expected time, please check your spam folder or just reply to this email.
              </p>

              <p style="margin:0 0 32px;font-size:15px;color:#444444;line-height:1.7;">
                Thank you for choosing us. We'll do our best work for you.
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
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.8;">
                Order ID: ${orderId}<br/>
                Service: ${meta.label}<br/>
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
    subject: `We've received your order — ${meta.label}`,
    html,
    text: `Hi ${firstName},\n\nThank you for your order! We've received your payment for the ${meta.label} service.\n\n${meta.description}\n\nWhat happens next:\n${meta.whatNext.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nExpected delivery: within ${meta.delivery}.\n\nWe'll send the design to this email address. If you don't see it in time, check your spam or reply to this email.\n\nWarm regards,\n${fromName}\n\nOrder ID: ${orderId}`,
  });

  logger.info(`📧 Service confirmation email sent to ${to} for order ${orderId} (${plan})`);
};