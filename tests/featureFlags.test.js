import assert from "node:assert/strict";
import test from "node:test";
import { isCardsFeatureEnabled } from "../src/config/featureFlags.js";

test("cards are enabled in development and disabled in production", () => {
  assert.equal(isCardsFeatureEnabled("development"), true);
  assert.equal(isCardsFeatureEnabled("production"), false);
});
