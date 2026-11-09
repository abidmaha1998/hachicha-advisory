import http from "node:http"
import { buildContactEmail, createTransport, readConfig } from "./mailer.mjs"

const config = readConfig()
const transporter = createTransport(config)
const port = Number(process.env.PORT || 3001)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

const MAX_BODY_BYTES = 20_000
const LIMITS = { name: 120, email: 200, phone: 40, service: 120, message: 5_000 }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Simple in-memory rate limit: at most 5 submissions per IP every 10 minutes.
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 5
const recentByIp = new Map()

function isRateLimited(ip) {
  const now = Date.now()
  const recent = (recentByIp.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS)
  if (recent.length >= RATE_MAX) {
    recentByIp.set(ip, recent)
    return true
  }
  recent.push(now)
  recentByIp.set(ip, recent)
  return false
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(body))
}

function applyCors(req, res) {
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Vary", "Origin")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on("data", (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function clean(value, maxLength, { multiline = false } = {}) {
  if (typeof value !== "string") return ""
  let text = value.trim()
  // Single-line fields must not carry line breaks (they end up in email headers and table cells).
  if (!multiline) text = text.replace(/[\r\n]+/g, " ")
  return text.slice(0, maxLength)
}

function validate(payload) {
  const submission = {
    name: clean(payload.name, LIMITS.name),
    email: clean(payload.email, LIMITS.email),
    phone: clean(payload.phone, LIMITS.phone),
    service: clean(payload.service, LIMITS.service),
    message: clean(payload.message, LIMITS.message, { multiline: true }),
  }
  const errors = []
  if (!submission.name) errors.push("name")
  if (!EMAIL_PATTERN.test(submission.email)) errors.push("email")
  if (!submission.service) errors.push("service")
  if (!submission.message) errors.push("message")
  return { submission, errors }
}

async function handleContact(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "unknown"
  if (isRateLimited(ip)) {
    return sendJson(res, 429, { ok: false, error: "Trop de demandes. Veuillez réessayer dans quelques minutes." })
  }

  let payload
  try {
    payload = JSON.parse(await readBody(req))
  } catch (error) {
    const status = error.status || 400
    return sendJson(res, status, { ok: false, error: "Requête invalide." })
  }

  // Honeypot field: real visitors never fill it, bots usually do.
  if (payload && typeof payload.website === "string" && payload.website.trim() !== "") {
    return sendJson(res, 200, { ok: true })
  }

  const { submission, errors } = validate(payload || {})
  if (errors.length > 0) {
    return sendJson(res, 400, { ok: false, error: "Certains champs sont manquants ou invalides.", fields: errors })
  }

  const email = buildContactEmail(submission, new Date())
  try {
    const info = await transporter.sendMail({
      from: { name: "Site Servini", address: config.from },
      to: config.to,
      replyTo: { name: submission.name, address: submission.email },
      subject: email.subject,
      text: email.text,
      html: email.html,
    })
    console.log(`[contact] sent ${info.messageId} from ${submission.email}`)
    return sendJson(res, 200, { ok: true })
  } catch (error) {
    console.error("[contact] SMTP send failed:", error.code || "", error.response || error.message)
    return sendJson(res, 502, {
      ok: false,
      error: "L'envoi de votre demande a échoué. Veuillez réessayer plus tard ou nous écrire directement par email.",
    })
  }
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res)
  const url = (req.url || "").split("?")[0]

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    return res.end()
  }
  if (url === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, { ok: true })
  }
  if (url === "/api/contact" && req.method === "POST") {
    try {
      return await handleContact(req, res)
    } catch (error) {
      console.error("[contact] unexpected error:", error)
      return sendJson(res, 500, { ok: false, error: "Erreur interne du serveur." })
    }
  }
  sendJson(res, 404, { ok: false, error: "Not found" })
})

server.listen(port, () => {
  console.log(`Contact API listening on http://localhost:${port}`)
})
