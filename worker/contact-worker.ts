type ContactTopic = "range" | "delivery" | "account" | "other";

type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  topic: ContactTopic;
  message: string;
};

type WorkerEnv = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  RESEND_API_KEY?: string;
};

const CONTACT_ENDPOINT = "/api/contact";
const RECIPIENT = "msourceltd@gmail.com";
const SENDER = "New website enquiry <contact@magneticsource.uk>";
const TRUSTED_ORIGINS = new Set([
  "https://magneticsource.uk",
  "https://www.magneticsource.uk",
]);

const topicLabels: Record<ContactTopic, string> = {
  range: "Product range",
  delivery: "Delivery",
  account: "Customer account",
  other: "Other support",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function isTopic(value: string): value is ContactTopic {
  return value === "range" || value === "delivery" || value === "account" || value === "other";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function parseContactPayload(input: unknown): ContactPayload | null {
  if (!input || typeof input !== "object") return null;

  const candidate = input as Record<string, unknown>;
  const name = clean(candidate.name, 100);
  const email = clean(candidate.email, 254).toLowerCase();
  const company = clean(candidate.company, 120);
  const topic = clean(candidate.topic, 24);
  const message = clean(candidate.message, 2000);

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !isTopic(topic) || message.length < 20) {
    return null;
  }

  return { name, email, company: company || undefined, topic, message };
}

function enquiryHtml(payload: ContactPayload) {
  const rows = [
    ["Name", payload.name],
    ["Email", payload.email],
    ["Company", payload.company || "Not provided"],
    ["Topic", topicLabels[payload.topic]],
  ].map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`).join("");

  return `<main style="font-family:Arial,sans-serif;color:#16202e;max-width:640px;margin:0 auto"><h2>New website enquiry</h2><table style="width:100%;border-collapse:collapse">${rows}</table><h3>Message</h3><p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p></main>`;
}

export async function handleContactRequest(request: Request, env: WorkerEnv) {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const origin = request.headers.get("Origin");
  if (origin && !TRUSTED_ORIGINS.has(origin)) return json({ error: "Request origin is not allowed." }, 403);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const payload = parseContactPayload(input);
  if (!payload) return json({ error: "Please complete the required fields." }, 400);

  if (!env.RESEND_API_KEY) return json({ error: "Contact delivery is not configured." }, 503);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SENDER,
      to: [RECIPIENT],
      reply_to: payload.email,
      subject: "New website enquiry",
      html: enquiryHtml(payload),
    }),
  });

  if (!response.ok) return json({ error: "Contact delivery failed." }, 502);
  return json({ ok: true }, 200);
}

export default {
  async fetch(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);
    if (url.pathname === CONTACT_ENDPOINT) return handleContactRequest(request, env);
    return env.ASSETS.fetch(request);
  },
};
