/**
 * Converts transport failures into a calm, useful message without exposing API
 * implementation details to wholesale customers.
 */
export function contactErrorMessage(message?: string) {
  const normalized = (message || "").toLowerCase();

  if (
    normalized.includes("unexpected end of json") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror")
  ) {
    return "This form needs the secure server version to send an email. Please use the published secure website link, or contact the trade desk directly for immediate help.";
  }

  return message || "We could not send your message. Please try again, or contact the trade desk directly.";
}
