import { expect, test } from "vitest";
import { DEGREE, IDENTITY_LINE } from "@/lib/siteConfig";

test("identity constants match the spec verbatim", () => {
  expect(DEGREE).toBe("BSc (Hons) Computing Science Graduate");
  expect(IDENTITY_LINE).toBe("Software Engineering · AI/ML · Data · Cloud");
});
