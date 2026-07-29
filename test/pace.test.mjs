/**
 * The Comptroller's office rate-limits this API to 1 request per second.
 * Exceeding it puts us into a persistent blocked state at their Imperva edge
 * that presents as a 403 on every later request, including from a browser
 * (observed 2026-07-28). These tests guard the pacer that prevents it.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { pace } from "../dist/checkbook.js";

const MIN_INTERVAL_MS = 1_100;
// Timers fire no earlier than requested but may fire late; allow a small
// tolerance below the nominal interval so a busy CI box does not flake.
const TOLERANCE_MS = 50;

test("spaces sequential calls at least 1s apart", async () => {
  const stamps = [];
  for (let i = 0; i < 3; i++) {
    await pace();
    stamps.push(Date.now());
  }

  for (let i = 1; i < stamps.length; i++) {
    const gap = stamps[i] - stamps[i - 1];
    assert.ok(
      gap >= MIN_INTERVAL_MS - TOLERANCE_MS,
      `gap ${i} was ${gap}ms, expected >= ${MIN_INTERVAL_MS - TOLERANCE_MS}ms`
    );
  }
});

test("serializes concurrent callers instead of letting them burst", async () => {
  // This is the case that actually bit us: several tool calls in flight at once.
  // Without serialization all three would resolve immediately together.
  const stamps = [];
  await Promise.all(
    Array.from({ length: 3 }, () => pace().then(() => stamps.push(Date.now())))
  );

  stamps.sort((a, b) => a - b);
  for (let i = 1; i < stamps.length; i++) {
    const gap = stamps[i] - stamps[i - 1];
    assert.ok(
      gap >= MIN_INTERVAL_MS - TOLERANCE_MS,
      `concurrent gap ${i} was ${gap}ms, expected >= ${MIN_INTERVAL_MS - TOLERANCE_MS}ms`
    );
  }
});
