import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("contact.deliveryStatus", () => {
  it("reports recipient configuration without exposing the recipient address", async () => {
    const previousRecipient = process.env.CONTACT_RECIPIENT;
    process.env.CONTACT_RECIPIENT = "msourceltd@gmail.com";

    const caller = appRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.contact.deliveryStatus()).resolves.toEqual({
      recipientConfigured: true,
      smtpConfigured: false,
    });

    process.env.CONTACT_RECIPIENT = previousRecipient;
  });
});
