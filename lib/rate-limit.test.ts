import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clearRateLimit, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    assert.equal(rateLimit(key, 2, 60_000).ok, true);
    assert.equal(rateLimit(key, 2, 60_000).ok, true);
    const blocked = rateLimit(key, 2, 60_000);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfterSec >= 1);
    clearRateLimit(key);
  });
});
