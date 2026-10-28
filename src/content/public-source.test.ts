import assert from "node:assert/strict";
import test from "node:test";
import { parsePublicSource, readPublicSource } from "./public-source";

test("unset and empty values mean the static source", () => {
  for (const value of [undefined, "", "   ", "\n"]) {
    assert.equal(parsePublicSource("ARTICLE_PUBLIC_SOURCE", value), "static");
  }
});

test("only the exact source names are accepted", () => {
  assert.equal(parsePublicSource("BOOK_PUBLIC_SOURCE", "static"), "static");
  assert.equal(parsePublicSource("BOOK_PUBLIC_SOURCE", "payload"), "payload");

  for (const value of ["Payload", "payload\n", " payload", "cms", "true"]) {
    assert.throws(
      () => parsePublicSource("PAGE_PUBLIC_SOURCE", value),
      (error: unknown) =>
        error instanceof Error &&
        error.message.startsWith("Invalid PAGE_PUBLIC_SOURCE value") &&
        error.message.includes(JSON.stringify(value)),
    );
  }
});

function withEnvironment(
  values: Record<string, string | undefined>,
  run: () => void,
): void {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("reading the environment applies the same rules to every type", () => {
  withEnvironment(
    {
      NODE_ENV: "development",
      ARTICLE_PUBLIC_SOURCE: "",
      PHOTO_PUBLIC_SOURCE: "payload",
      NAVIGATION_PUBLIC_SOURCE: "Static",
    },
    () => {
      assert.equal(readPublicSource("ARTICLE_PUBLIC_SOURCE"), "static");
      assert.equal(readPublicSource("PHOTO_PUBLIC_SOURCE"), "payload");
      assert.throws(
        () => readPublicSource("NAVIGATION_PUBLIC_SOURCE"),
        /Invalid NAVIGATION_PUBLIC_SOURCE/,
      );
    },
  );
});

test("a production payload source still requires persistent infrastructure", () => {
  withEnvironment(
    {
      NODE_ENV: "production",
      PAGE_PUBLIC_SOURCE: "payload",
      PAYLOAD_DATABASE: "sqlite",
      PAYLOAD_STORAGE: "local",
    },
    () => {
      // The infrastructure check itself lives in src/lib/payloadInfrastructure.
      assert.throws(() => readPublicSource("PAGE_PUBLIC_SOURCE"), Error);
    },
  );
});
