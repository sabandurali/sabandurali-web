import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveButtonKey,
  resolvePanelKey,
  shouldCloseOnFocusMove,
} from "./menu-keys";

test("arrow keys on a menu button open the panel and move into it", () => {
  assert.deepEqual(resolveButtonKey("ArrowDown", false), {
    type: "open",
    focus: "first",
  });
  assert.deepEqual(resolveButtonKey("ArrowUp", false), {
    type: "open",
    focus: "last",
  });
  assert.deepEqual(resolveButtonKey("ArrowDown", true), {
    type: "open",
    focus: "first",
  });
});

test("Enter, Space and Tab keep native behaviour; focus alone opens nothing", () => {
  for (const key of ["Enter", " ", "Tab", "a"]) {
    assert.deepEqual(resolveButtonKey(key, false), { type: "none" });
  }
});

test("Escape closes an open panel and returns focus to its button", () => {
  assert.deepEqual(resolveButtonKey("Escape", true), {
    type: "close",
    focusButton: true,
  });
  assert.deepEqual(resolveButtonKey("Escape", false), { type: "none" });
  assert.deepEqual(resolvePanelKey("Escape", 2, 5), {
    type: "close",
    focusButton: true,
  });
  assert.deepEqual(resolvePanelKey("Escape", -1, 0), {
    type: "close",
    focusButton: true,
  });
});

test("arrows, Home and End move between panel links without wrapping", () => {
  assert.deepEqual(resolvePanelKey("ArrowDown", 0, 3), {
    type: "focus-link",
    index: 1,
  });
  assert.deepEqual(resolvePanelKey("ArrowDown", 2, 3), {
    type: "focus-link",
    index: 2,
  });
  assert.deepEqual(resolvePanelKey("ArrowUp", 0, 3), {
    type: "focus-link",
    index: 0,
  });
  assert.deepEqual(resolvePanelKey("Home", 2, 3), {
    type: "focus-link",
    index: 0,
  });
  assert.deepEqual(resolvePanelKey("End", 0, 3), {
    type: "focus-link",
    index: 2,
  });
});

test("Tab is never captured inside the panel", () => {
  assert.deepEqual(resolvePanelKey("Tab", 1, 3), { type: "none" });
  assert.deepEqual(resolvePanelKey("ArrowDown", -1, 3), { type: "none" });
  assert.deepEqual(resolvePanelKey("ArrowDown", 0, 0), { type: "none" });
});

test("the panel closes only when focus moves to an element outside its item", () => {
  const inside = { id: "inside" };
  const outside = { id: "outside" };
  const item = {
    contains: (node: { id: string } | null) => node === inside,
  };
  assert.equal(shouldCloseOnFocusMove(item, outside), true);
  assert.equal(shouldCloseOnFocusMove(item, inside), false);
  // null: focus left the page or a click hit plain panel text.
  assert.equal(shouldCloseOnFocusMove(item, null), false);
});
