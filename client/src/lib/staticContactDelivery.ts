export type StaticContactPayload = {
  name: string;
  email: string;
  company?: string;
  topic: "range" | "delivery" | "account" | "other";
  message: string;
};

export const formSubmitEndpoint = "https://formsubmit.co/ajax/msourceltd@gmail.com";

export async function submitStaticContact(payload: StaticContactPayload) {
  const response = await fetch(formSubmitEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      company: payload.company || "Not provided",
      topic: payload.topic,
      message: payload.message,
      _replyto: payload.email,
      _subject: `Magnetic Source trade enquiry: ${payload.topic}`,
      _template: "table",
      _captcha: "true",
    }),
  });

  if (!response.ok) {
    throw new Error("Contact delivery failed.");
  }
}
