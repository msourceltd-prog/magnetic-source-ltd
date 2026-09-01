import { describe, expect, it, vi } from "vitest";
import { handleContactRequest, handleStripeTestCheckout } from "./contact-worker";

const basePayload = {
  name: "Taylor Smith",
  email: "taylor@example.com",
  company: "North Street Retail",
  topic: "delivery",
  message: "Please send current delivery information for our first order.",
};

describe("Cloudflare Contact endpoint", () => {
  it("sends a validated enquiry through the configured email provider", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"email_1"}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await handleContactRequest(
      new Request("https://magneticsource.uk/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://magneticsource.uk" },
        body: JSON.stringify(basePayload),
      }),
      { ASSETS: { fetch: vi.fn() }, RESEND_API_KEY: "test-key" },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(JSON.parse(String(request.body))).toMatchObject({
      from: "New customer enquiry <contact@magneticsource.uk>",
      to: ["msourceltd@gmail.com"],
      reply_to: "taylor@example.com",
      subject: "New customer enquiry",
    });
  });

  it("rejects invalid messages before trying to send email", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await handleContactRequest(
      new Request("https://magneticsource.uk/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayload, message: "Too short" }),
      }),
      { ASSETS: { fetch: vi.fn() }, RESEND_API_KEY: "test-key" },
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores an unrelated browser-autofilled field and still delivers the real enquiry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"email_2"}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await handleContactRequest(
      new Request("https://magneticsource.uk/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://magneticsource.uk" },
        body: JSON.stringify({ ...basePayload, website: "unexpected value" }),
      }),
      { ASSETS: { fetch: vi.fn() }, RESEND_API_KEY: "test-key" },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("creates a fixed-value Stripe sandbox session only when given a test secret", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/test_session" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await handleStripeTestCheckout(
      new Request("https://magneticsource.uk/api/stripe/test-checkout", {
        method: "POST",
        headers: { Origin: "https://magneticsource.uk" },
      }),
      { ASSETS: { fetch: vi.fn() }, STRIPE_TEST_SECRET_KEY: "sk_test_example" },
    );

    expect(response.status).toBe(200);
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.headers).toMatchObject({ "Content-Type": "application/x-www-form-urlencoded" });
    const params = new URLSearchParams(String(request.body));
    expect(params.get("line_items[0][price_data][unit_amount]")).toBe("100");
    expect(params.get("metadata[integration_mode]")).toBe("test_only");
  });

  it("refuses a non-test Stripe key", async () => {
    const response = await handleStripeTestCheckout(
      new Request("https://magneticsource.uk/api/stripe/test-checkout", {
        method: "POST",
        headers: { Origin: "https://magneticsource.uk" },
      }),
      { ASSETS: { fetch: vi.fn() }, STRIPE_TEST_SECRET_KEY: "sk_live_not_allowed" },
    );

    expect(response.status).toBe(503);
  });
});
