import { afterEach, describe, expect, it, vi } from "vitest";
import { formSubmitEndpoint, submitStaticContact } from "./staticContactDelivery";

describe("submitStaticContact", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the named Contact fields to the static FormSubmit endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await submitStaticContact({
      name: "Taylor Smith",
      email: "taylor@example.com",
      company: "North Street Retail",
      topic: "delivery",
      message: "Please send current delivery information for our first order.",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      formSubmitEndpoint,
      expect.objectContaining({ method: "POST" }),
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.headers).toEqual({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    expect(JSON.parse(String(request.body))).toMatchObject({
      name: "Taylor Smith",
      email: "taylor@example.com",
      company: "North Street Retail",
      topic: "delivery",
      _replyto: "taylor@example.com",
      _template: "table",
      _captcha: "true",
    });
  });

  it("reports failed delivery instead of showing a false success message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));

    await expect(
      submitStaticContact({
        name: "Taylor Smith",
        email: "taylor@example.com",
        topic: "range",
        message: "Please share the current product range information with us.",
      }),
    ).rejects.toThrow("Contact delivery failed.");
  });
});
