import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import nodemailer from "nodemailer"

const here = path.dirname(fileURLToPath(import.meta.url))
const envFile = path.join(here, ".env")
if (fs.existsSync(envFile)) process.loadEnvFile(envFile)

const REQUIRED = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM", "MAIL_TO"]

export function readConfig() {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}. Copy server/.env.example to server/.env and fill it in.`,
    )
  }
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
  }
}

export function createTransport(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // Port 587 starts in plain text and must upgrade with STARTTLS.
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: { user: config.user, pass: config.password },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  })
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatReceivedAt(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Africa/Tunis",
  }).format(date)
}

export function buildContactEmail(submission, receivedAt = new Date()) {
  const received = formatReceivedAt(receivedAt)
  const rows = [
    ["Nom complet", submission.name],
    ["Adresse email", submission.email],
    ["Téléphone", submission.phone || "Non renseigné"],
    ["Service souhaité", submission.service],
    ["Date de réception", received],
  ]

  const rowsHtml = rows
    .map(
      ([label, value]) => `
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e6ebe8;color:#6b736f;font-size:13px;width:170px;vertical-align:top;">${escapeHtml(label)}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e6ebe8;color:#17201b;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
          </tr>`,
    )
    .join("")

  const messageHtml = escapeHtml(submission.message).replace(/\r?\n/g, "<br>")

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f3f6f4;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f4;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e1e7e3;">
            <tr>
              <td style="background:#17201b;padding:24px 28px;">
                <div style="color:#8fd3ad;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Servini · Hachicha Advisory</div>
                <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:8px;">Nouvelle demande de contact</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px;color:#4d534f;font-size:14px;line-height:1.6;">
                Une nouvelle demande a été envoyée depuis le formulaire de contact du site.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rowsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 8px;color:#6b736f;font-size:13px;">Message</td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <div style="background:#f3f6f4;border-left:3px solid #39805d;padding:16px 18px;color:#17201b;font-size:14px;line-height:1.7;">${messageHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #e6ebe8;color:#9aa29e;font-size:11px;">
                Répondez directement à cet email pour contacter ${escapeHtml(submission.name)}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    "Nouvelle demande de contact – Servini",
    "",
    ...rows.map(([label, value]) => `${label} : ${value}`),
    "",
    "Message :",
    submission.message,
  ].join("\n")

  return { subject: "Nouvelle demande de contact – Servini", html, text }
}
