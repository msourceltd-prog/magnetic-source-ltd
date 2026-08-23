import nodemailer from "nodemailer";

export type ContactMail = {
  name: string;
  email: string;
  company?: string;
  topic: string;
  message: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  recipient: string;
};

export function getSmtpConfig(environment: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  const host = environment.SMTP_HOST?.trim();
  const user = environment.SMTP_USER?.trim();
  const password = environment.SMTP_PASSWORD?.trim();
  const from = environment.SMTP_FROM?.trim() || user;
  const recipient = environment.CONTACT_RECIPIENT?.trim() || "msourceltd@gmail.com";
  const parsedPort = Number(environment.SMTP_PORT || "587");

  if (!host || !user || !password || !from || !Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) return null;
  return { host, port: parsedPort, user, password, from, recipient };
}

export async function deliverContactMail(contact: ContactMail) {
  const config = getSmtpConfig();
  if (!config) return { delivered: false as const };

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
  });

  await transport.sendMail({
    from: config.from,
    to: config.recipient,
    replyTo: contact.email,
    subject: `Website enquiry: ${contact.topic}`,
    text: [
      `Name: ${contact.name}`,
      `Email: ${contact.email}`,
      contact.company ? `Company: ${contact.company}` : "",
      `Topic: ${contact.topic}`,
      "",
      contact.message,
    ].filter(Boolean).join("\n"),
  });

  return { delivered: true as const };
}
