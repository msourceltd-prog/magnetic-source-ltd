export type StaticContactPayload = {
  name: string;
  email: string;
  company?: string;
  topic: "range" | "delivery" | "account" | "other";
  message: string;
};

export const contactEndpoint = "/api/contact";

export async function submitStaticContact(payload: StaticContactPayload) {
  const response = await fetch(contactEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      company: payload.company,
      topic: payload.topic,
      message: payload.message,
    }),
  });

  if (!response.ok) {
    throw new Error("Contact delivery failed.");
  }
}
