import { describe, expect, it } from "vitest";
import { contactErrorMessage } from "./contactErrorMessage";

describe("contactErrorMessage", () => {
  it("hides raw JSON parser errors when a static site has no Contact API", () => {
    expect(contactErrorMessage("Failed to execute 'json' on 'Response': Unexpected end of JSON input"))
      .toContain("secure server version");
  });

  it("retains safe server validation messages", () => {
    expect(contactErrorMessage("Please include a valid email address.")).toBe("Please include a valid email address.");
  });
});
