type ContactTopic = "range" | "delivery" | "account" | "other";
/**
 * Magnetic Source Worker: private contact delivery plus a test-only Stripe Checkout route.
 * The payment route accepts only a Stripe `sk_test_` secret stored in Cloudflare and
 * creates a fixed £1.00 sandbox session; it cannot collect live customer money.
 */
type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  topic: ContactTopic;
  message: string;
};

type WorkerEnv = {
  ASSETS: { fetch(request: Request): Promise<Response>; };
  RESEND_API_KEY?: string;
  STRIPE_TEST_SECRET_KEY?: string;
};

const CONTACT_ENDPOINT = "/api/contact";
const STRIPE_TEST_CHECKOUT_ENDPOINT = "/api/stripe/test-checkout";
const RECIPIENT = "msourceltd@gmail.com";
const SENDER = "New customer enquiry <contact@magneticsource.uk>";
const TRUSTED_ORIGINS = new Set(["https://magneticsource.uk", "https://www.magneticsource.uk"]);

const topicLabels: Record<ContactTopic, string> = {
  range: "Product range", delivery: "Delivery", account: "Customer account", other: "Other support",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function isTopic(value: string): value is ContactTopic {
  return value === "range" || value === "delivery" || value === "account" || value === "other";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

function parseContactPayload(input: unknown): ContactPayload | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Record<string, unknown>;
  const name = clean(candidate.name, 100);
  const email = clean(candidate.email, 254).toLowerCase();
  const company = clean(candidate.company, 120);
  const topic = clean(candidate.topic, 24);
  const message = clean(candidate.message, 2000);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !isTopic(topic) || message.length < 20) return null;
  return { name, email, company: company || undefined, topic, message };
}

function enquiryHtml(payload: ContactPayload) {
  const rows = [["Name", payload.name], ["Email", payload.email], ["Company", payload.company || "Not provided"], ["Topic", topicLabels[payload.topic]]]
    .map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`).join("");
  return `<main style="font-family:Arial,sans-serif;color:#16202e;max-width:640px;margin:0 auto"><h2>New customer enquiry</h2><table style="width:100%;border-collapse:collapse">${rows}</table><h3>Message</h3><p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p></main>`;
}

export async function handleContactRequest(request: Request, env: WorkerEnv) {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const origin = request.headers.get("Origin");
  if (origin && !TRUSTED_ORIGINS.has(origin)) return json({ error: "Request origin is not allowed." }, 403);
  let input: unknown;
  try { input = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const payload = parseContactPayload(input);
  if (!payload) return json({ error: "Please complete the required fields." }, 400);
  if (!env.RESEND_API_KEY) return json({ error: "Contact delivery is not configured." }, 503);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: SENDER, to: [RECIPIENT], reply_to: payload.email, subject: "New customer enquiry", html: enquiryHtml(payload) }),
  });
  if (!response.ok) return json({ error: "Contact delivery failed." }, 502);
  return json({ ok: true }, 200);
}

export async function handleStripeTestCheckout(request: Request, env: WorkerEnv) {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const origin = request.headers.get("Origin");
  if (!origin || !TRUSTED_ORIGINS.has(origin)) return json({ error: "Request origin is not allowed." }, 403);
  const secretKey = env.STRIPE_TEST_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_test_")) return json({ error: "Test checkout is not configured." }, 503);
  const params = new URLSearchParams({
    mode: "payment", success_url: `${origin}/order-confirmation?test_payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?test_payment=cancelled`, "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "gbp", "line_items[0][price_data][product_data][name]": "Magnetic Source checkout test",
    "line_items[0][price_data][product_data][description]": "Test payment only — no real money is collected.",
    "line_items[0][price_data][unit_amount]": "100", "line_items[0][quantity]": "1", "metadata[integration_mode]": "test_only",
  });
  let stripeResponse: Response;
  try {
    stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST", headers: { Authorization: `Basic ${btoa(`${secretKey}:`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString(),
    });
  } catch { return json({ error: "Test checkout is temporarily unavailable." }, 502); }
  if (!stripeResponse.ok) return json({ error: "Test checkout could not be started." }, 502);
  const session = await stripeResponse.json<{ url?: unknown }>();
  if (typeof session.url !== "string" || !session.url.startsWith("https://checkout.stripe.com/")) return json({ error: "Test checkout could not be started." }, 502);
  return json({ url: session.url }, 200);
}

export default {
  async fetch(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);
    if (url.pathname === CONTACT_ENDPOINT) return handleContactRequest(request, env);
    if (url.pathname === STRIPE_TEST_CHECKOUT_ENDPOINT) return handleStripeTestCheckout(request, env);
    return env.ASSETS.fetch(request);
  },
};
