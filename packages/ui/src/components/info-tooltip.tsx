"use client";

import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useEffect, useId, useReducer, useRef } from "react";

import { cn } from "../lib/cn";

type InfoTooltipState = {
  focused: boolean;
  hovered: boolean;
  pinned: boolean;
};

type InfoTooltipAction =
  | { type: "hover-start" }
  | { type: "hover-end" }
  | { type: "focus-start" }
  | { type: "focus-end" }
  | { type: "toggle-pin" }
  | { type: "dismiss" };

const INITIAL_STATE: InfoTooltipState = {
  focused: false,
  hovered: false,
  pinned: false,
};

export function reduceInfoTooltipState(state: InfoTooltipState, action: InfoTooltipAction): InfoTooltipState {
  switch (action.type) {
    case "hover-start":
      return { ...state, hovered: true };
    case "hover-end":
      return { ...state, hovered: false };
    case "focus-start":
      return { ...state, focused: true };
    case "focus-end":
      return { ...state, focused: false };
    case "toggle-pin":
      return { ...state, pinned: !state.pinned };
    case "dismiss":
      return INITIAL_STATE;
    default:
      return state;
  }
}

export function isInfoTooltipOpen(state: InfoTooltipState) {
  return state.focused || state.hovered || state.pinned;
}

export function InfoTooltip({
  className,
  content,
  label = "More information",
}: {
  className?: string;
  content: ReactNode;
  label?: string;
}) {
  const [state, dispatch] = useReducer(reduceInfoTooltipState, INITIAL_STATE);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const tooltipId = useId();
  const open = isInfoTooltipOpen(state);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        dispatch({ type: "dismiss" });
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch({ type: "dismiss" });
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleClick(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dispatch({ type: "toggle-pin" });
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    if (rootRef.current?.contains(event.relatedTarget as Node | null)) {
      return;
    }

    dispatch({ type: "focus-end" });
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      dispatch({ type: "dismiss" });
    }
  }

  return (
    <span
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => dispatch({ type: "hover-start" })}
      onMouseLeave={() => dispatch({ type: "hover-end" })}
      ref={rootRef}
    >
      <button
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        aria-label={label}
        className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-rim bg-white text-[11px] font-semibold text-muted transition-colors hover:border-ember hover:text-ember focus:border-ember focus:outline-none"
        onBlur={handleBlur}
        onClick={handleClick}
        onFocus={() => dispatch({ type: "focus-start" })}
        onKeyDown={handleKeyDown}
        type="button"
      >
        i
      </button>
      {open && (
        <span
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(260px,calc(100vw-2rem))] rounded-xl border border-rim bg-white p-3 text-[12.5px] leading-relaxed text-ink shadow-modal"
          id={tooltipId}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  );
}
