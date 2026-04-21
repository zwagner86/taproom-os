import { describe, expect, it } from "vitest";

import { isInfoTooltipOpen, reduceInfoTooltipState } from "./info-tooltip";

const INITIAL_STATE = {
  focused: false,
  hovered: false,
  pinned: false,
};

describe("InfoTooltip state helpers", () => {
  it("opens for hover, focus, and pinned interactions", () => {
    const hovered = reduceInfoTooltipState(INITIAL_STATE, { type: "hover-start" });
    const focused = reduceInfoTooltipState(INITIAL_STATE, { type: "focus-start" });
    const pinned = reduceInfoTooltipState(INITIAL_STATE, { type: "toggle-pin" });

    expect(isInfoTooltipOpen(INITIAL_STATE)).toBe(false);
    expect(hovered).toEqual({ focused: false, hovered: true, pinned: false });
    expect(focused).toEqual({ focused: true, hovered: false, pinned: false });
    expect(pinned).toEqual({ focused: false, hovered: false, pinned: true });
    expect(isInfoTooltipOpen(hovered)).toBe(true);
    expect(isInfoTooltipOpen(focused)).toBe(true);
    expect(isInfoTooltipOpen(pinned)).toBe(true);
  });

  it("closes when hover and focus end, and dismiss resets pinned state", () => {
    const activeState = {
      focused: true,
      hovered: true,
      pinned: true,
    };

    const afterHoverEnd = reduceInfoTooltipState(activeState, { type: "hover-end" });
    const afterFocusEnd = reduceInfoTooltipState(afterHoverEnd, { type: "focus-end" });
    const afterDismiss = reduceInfoTooltipState(afterFocusEnd, { type: "dismiss" });

    expect(afterHoverEnd).toEqual({ focused: true, hovered: false, pinned: true });
    expect(afterFocusEnd).toEqual({ focused: false, hovered: false, pinned: true });
    expect(isInfoTooltipOpen(afterFocusEnd)).toBe(true);
    expect(afterDismiss).toEqual(INITIAL_STATE);
    expect(isInfoTooltipOpen(afterDismiss)).toBe(false);
  });
});
