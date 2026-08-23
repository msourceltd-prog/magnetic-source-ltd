import { describe, expect, it } from "vitest";
import { getSmtpConfig } from "./contactMailer";

describe("getSmtpConfig", () => {
  it("requires complete private SMTP settings before enabling email delivery", () => {
    expect(getSmtpConfig({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "msourceltd@gmail.com" })).toBeNull();

    expect(getSmtpConfig({
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_USER: "msourceltd@gmail.com",
      SMTP_PASSWORD: "app-password",
      SMTP_FROM: "msourceltd@gmail.com",
      CONTACT_RECIPIENT: "msourceltd@gmail.com",
    })).toMatchObject({
      host: "smtp.gmail.com",
      port: 587,
      recipient: "msourceltd@gmail.com",
    });
  });
});
