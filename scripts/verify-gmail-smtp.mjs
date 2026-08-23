import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST?.trim();
const port = Number(process.env.SMTP_PORT || "587");
const user = process.env.SMTP_USER?.trim();
const password = process.env.SMTP_PASSWORD?.replace(/\s+/g, "").trim();

if (!host || !user || !password || !Number.isInteger(port)) {
  throw new Error("Complete SMTP settings are required before verifying Gmail delivery.");
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass: password },
});

await transport.verify();
console.log("Gmail SMTP connection verified without sending an email.");
