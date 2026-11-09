// Checks that the SMTP server is reachable and that the credentials in server/.env are accepted.
// Usage: npm run verify-smtp            (connection + login only, sends nothing)
//        npm run verify-smtp -- --send  (also sends one test email to MAIL_TO)
import { buildContactEmail, createTransport, readConfig } from "./mailer.mjs"

const config = readConfig()
const transporter = createTransport(config)

console.log(`Connecting to ${config.host}:${config.port} as ${config.user} ...`)
try {
  await transporter.verify()
  console.log("OK: server reachable, STARTTLS negotiated, login accepted.")
} catch (error) {
  console.error("FAILED:", error.code || "", error.response || error.message)
  if (String(error.response || "").includes("535")) {
    console.error(
      "Login refused. Check the password, and that SMTP AUTH is enabled for this mailbox in Microsoft 365 (and that basic authentication for SMTP is still allowed on the tenant).",
    )
  }
  process.exit(1)
}

if (process.argv.includes("--send")) {
  const email = buildContactEmail({
    name: "Test Servini",
    email: config.from,
    phone: "+216 00 000 000",
    service: "Test",
    message: "Ceci est un email de test envoyé par server/verify-smtp.mjs.",
  })
  const info = await transporter.sendMail({
    from: { name: "Site Servini", address: config.from },
    to: config.to,
    subject: `[TEST] ${email.subject}`,
    text: email.text,
    html: email.html,
  })
  console.log(`Test email sent to ${config.to} (message id ${info.messageId}). Check the inbox.`)
}
