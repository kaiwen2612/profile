import { expect, test } from "vitest";
import { buildRootMetadata, personJsonLd } from "@/lib/metadata";

test("root metadata carries a canonical and OG image", () => {
  const m = buildRootMetadata();
  expect(m.alternates?.canonical).toBeTruthy();
  expect(JSON.stringify(m.openGraph?.images)).toContain("/og.png");
});

test("Person JSON-LD has sameAs links and jobTitle = degree", () => {
  const ld = personJsonLd() as Record<string, unknown>;
  expect(ld["@type"]).toBe("Person");
  expect(ld.jobTitle).toBe("BSc (Hons) Computing Science Graduate");
  expect((ld.sameAs as string[]).length).toBe(2);
});
