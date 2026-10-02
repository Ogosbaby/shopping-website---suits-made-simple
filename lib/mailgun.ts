import type { Order, OrderItem } from "@/types";
import { formatMoney } from "@/lib/format";

/**
 * Mailgun transactional email — the order confirmation is sent through the
 * Mailgun REST API immediately after a successful checkout.
 */

interface MailgunConfig {
  apiKey: string;
  domain: string;
  baseUrl: string;
  from: string;
}

function getMailgunConfig(): MailgunConfig | null {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return null;
  }

  return {
    apiKey,
    domain,
    baseUrl: (process.env.MAILGUN_BASE_URL ?? "https://api.mailgun.net").replace(/\/$/, ""),
    from: process.env.MAILGUN_FROM ?? `Suits Made Simple <postmaster@${domain}>`,
  };
}

export function isMailgunConfigured(): boolean {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}

// Prices are formatted with the shared naira formatter so the email and the
// storefront can never disagree.
export { formatMoney };

function formatMeasurements(item: OrderItem): string {
  if (item.size_type !== "custom" || !item.measurements) return "";
  const m = item.measurements;
  return [
    `Neck ${m.neck}"`,
    `Chest ${m.chest}"`,
    `Waist ${m.waist}"`,
    `Jacket Length ${m.jacket_length}"`,
    `Sleeve Length ${m.sleeve_length}"`,
    `Trouser Length ${m.trouser_length}"`,
  ].join(" · ");
}

function sizeLabel(item: OrderItem): string {
  return item.size_type === "custom"
    ? "Custom tailoring"
    : `Standard ${item.standard_size ?? "—"}`;
}

function renderItemsRows(items: OrderItem[]): string {
  return items
    .map((item) => {
      const fit = formatMeasurements(item);
      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #E3E6EA;vertical-align:top;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#242B34;letter-spacing:0.02em;">${item.product_name}</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#5A6675;margin-top:4px;">${sizeLabel(item)}${
              fit ? `<br /><span style="color:#8B95A3;">${fit}</span>` : ""
            }</div>
          </td>
          <td style="padding:16px 0;border-bottom:1px solid #E3E6EA;vertical-align:top;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5A6675;">${item.quantity}</td>
          <td style="padding:16px 0;border-bottom:1px solid #E3E6EA;vertical-align:top;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#242B34;">${formatMoney(
            item.line_total_cents
          )}</td>
        </tr>`;
    })
    .join("");
}

export function renderOrderConfirmationHtml(order: Order, items: OrderItem[]): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const firstName = order.full_name.trim().split(/\s+/)[0] || "Sir";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Order ${order.order_number}</title></head>
<body style="margin:0;padding:0;background-color:#F1F2F4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F2F4;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E3E6EA;">
        <tr>
          <td style="background-color:#3B4654;padding:36px 40px;text-align:center;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:0.22em;color:#FFFFFF;">SMS</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.34em;color:#C9CDD4;margin-top:8px;text-transform:uppercase;">Suits Made Simple</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#242B34;">Order confirmed</div>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#5A6675;margin:14px 0 0;">
              ${firstName}, thank you for your order. Our tailoring team has received it and will begin
              preparing your garments. Your order reference is
              <strong style="color:#3B4654;">${order.order_number}</strong>.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8B95A3;border-bottom:1px solid #E3E6EA;padding-bottom:8px;">Item</td>
                <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8B95A3;border-bottom:1px solid #E3E6EA;padding-bottom:8px;text-align:center;">Qty</td>
                <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8B95A3;border-bottom:1px solid #E3E6EA;padding-bottom:8px;text-align:right;">Total</td>
              </tr>
              ${renderItemsRows(items)}
              <tr>
                <td colspan="2" style="padding:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5A6675;">Subtotal</td>
                <td style="padding:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#242B34;text-align:right;">${formatMoney(
                  order.subtotal_cents
                )}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5A6675;">Shipping</td>
                <td style="padding:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#242B34;text-align:right;">Complimentary</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#242B34;border-top:1px solid #E3E6EA;">Total</td>
                <td style="padding:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#242B34;text-align:right;border-top:1px solid #E3E6EA;">${formatMoney(
                  order.total_cents
                )}</td>
              </tr>
            </table>
            <div style="margin-top:32px;padding:20px;background-color:#F1F2F4;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8B95A3;">Delivering to</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#242B34;margin-top:8px;">
                ${order.full_name}<br />
                ${order.address_line1}${order.address_line2 ? `<br />${order.address_line2}` : ""}<br />
                ${order.city}, ${order.state}${order.postal_code ? ` ${order.postal_code}` : ""}<br />
                ${order.country}<br />
                ${order.phone}
              </div>
            </div>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#5A6675;margin:28px 0 0;">
              A member of our concierge will contact you shortly to confirm fitting details and payment.
            </p>
            <div style="margin-top:32px;text-align:center;">
              <a href="${siteUrl}/shop" style="display:inline-block;background-color:#3B4654;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;padding:14px 34px;">Return to the collection</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#2C3541;padding:24px 40px;text-align:center;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8B95A3;">Distinction in every detail</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderOrderConfirmationText(order: Order, items: OrderItem[]): string {
  const lines = items.map((item) => {
    const fit = formatMeasurements(item);
    return `- ${item.product_name} — ${sizeLabel(item)}${fit ? ` (${fit})` : ""} × ${item.quantity} — ${formatMoney(
      item.line_total_cents
    )}`;
  });

  return [
    "SUITS MADE SIMPLE",
    "Order confirmed",
    "",
    `Thank you for your order, ${order.full_name}.`,
    `Order reference: ${order.order_number}`,
    "",
    "Items:",
    ...lines,
    "",
    `Subtotal: ${formatMoney(order.subtotal_cents)}`,
    "Shipping: Complimentary",
    `Total: ${formatMoney(order.total_cents)}`,
    "",
    "Delivering to:",
    order.full_name,
    order.address_line1,
    ...(order.address_line2 ? [order.address_line2] : []),
    `${order.city}, ${order.state}${order.postal_code ? ` ${order.postal_code}` : ""}`,
    order.country,
    order.phone,
    "",
    "A member of our concierge will contact you shortly to confirm fitting details and payment.",
    "",
    "Distinction in every detail.",
  ].join("\n");
}

/**
 * Sends order confirmation via Nodemailer when Mailgun reaches limits or fails.
 */
async function sendViaNodemailer(order: Order, items: OrderItem[]): Promise<boolean> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);

  if (!user || !pass) {
    console.warn("[email] Nodemailer fallback skipped: SMTP_USER/SMTP_PASS are not set.");
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: process.env.MAILGUN_FROM || `"Suits Made Simple" <${user}>`,
      to: order.email,
      subject: `Order ${order.order_number} confirmed — Suits Made Simple`,
      text: renderOrderConfirmationText(order, items),
      html: renderOrderConfirmationHtml(order, items),
    });

    console.log(`[email] Order ${order.order_number} confirmed via Nodemailer fallback.`);
    return true;
  } catch (error) {
    console.error("[email] Nodemailer send failed:", error);
    return false;
  }
}

/**
 * Sends the confirmation email through Mailgun with an automatic Nodemailer fallback.
 * Returns `true` when either provider accepted the message.
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[]
): Promise<boolean> {
  const config = getMailgunConfig();

  if (!config) {
    console.warn("[mailgun] Config missing, trying Nodemailer fallback...");
    return sendViaNodemailer(order, items);
  }

  const body = new URLSearchParams({
    from: config.from,
    to: order.email,
    subject: `Order ${order.order_number} confirmed — Suits Made Simple`,
    text: renderOrderConfirmationText(order, items),
    html: renderOrderConfirmationHtml(order, items),
  });

  try {
    const response = await fetch(`${config.baseUrl}/v3/${config.domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[mailgun] send failed (${response.status}): ${detail} — falling back to Nodemailer.`);
      return sendViaNodemailer(order, items);
    }

    return true;
  } catch (error) {
    console.error("[mailgun] send threw error, falling back to Nodemailer:", error);
    return sendViaNodemailer(order, items);
  }
}
