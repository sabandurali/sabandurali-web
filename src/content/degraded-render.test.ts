import assert from "node:assert/strict";
import test from "node:test";
import {
  DegradedRenderError,
  refuseDegradedCachedRender,
  rendersOverCachedResult,
} from "./degraded-render";

const server = {
  NODE_ENV: "production",
  NEXT_PHASE: "phase-production-server",
};
const build = { NODE_ENV: "production", NEXT_PHASE: "phase-production-build" };
const dev = { NODE_ENV: "development" };

test("only a production server render replaces a cached result", () => {
  assert.equal(rendersOverCachedResult(server), true);
  assert.equal(rendersOverCachedResult({ NODE_ENV: "production" }), true);
  assert.equal(rendersOverCachedResult(build), false);
  assert.equal(rendersOverCachedResult(dev), false);
  assert.equal(rendersOverCachedResult({}), false);
});

test("a degraded render is refused on a production server", () => {
  assert.throws(
    () => refuseDegradedCachedRender("sitemap", ["district guides"], server),
    (error: unknown) =>
      error instanceof DegradedRenderError &&
      /sitemap: district guides unavailable/.test(error.message),
  );
});

test("a complete render, a build and dev keep rendering", () => {
  assert.doesNotThrow(() => refuseDegradedCachedRender("sitemap", [], server));
  assert.doesNotThrow(() =>
    refuseDegradedCachedRender("sitemap", ["photos"], build),
  );
  assert.doesNotThrow(() =>
    refuseDegradedCachedRender("sitemap", ["photos"], dev),
  );
});
