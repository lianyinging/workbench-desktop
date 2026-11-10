// Unified window-drag contract for macOS Overlay chrome (no system title bar).
// Session UI uses JS start_dragging only — not data-tauri-drag-region — so cursor
// feedback stays consistent and text hit-testing cannot force the I-beam.

import { isTauri, startWindowDrag } from "./tauri";

const INTERACTIVE =
  "button, a, input, textarea, select, label, [role='button'], [role='menuitem'], [role='link'], [contenteditable='true']";

/** CSS class for contiguous drag chrome (topbar, sidebar brand). */
export const WINDOW_DRAG_CLASS = "window-drag";

/** CSS class for labels inside a drag region — pointer-events: none so text never shows I-beam. */
export const WINDOW_DRAG_LABEL_CLASS = "window-drag-label";

/** Attribute toggled while a native window drag is in progress — drives `cursor: grabbing`. */
export const WINDOW_DRAGGING_ATTR = "data-window-dragging";

/** Ignore the synthetic pointerup macOS/WebKit fires right as start_dragging takes over. */
export const WINDOW_DRAG_CLEAR_GRACE_MS = 600;

export function shouldStartWindowDrag(event: { button: number; target: EventTarget | null }): boolean {
  if (event.button !== 0) return false;
  const el = event.target as Element | null;
  return !(el && typeof el.closest === "function" && el.closest(INTERACTIVE));
}

let clearBound = false;
let dragStartedAt = 0;

function applyGrabbingCursor(on: boolean) {
  const root = document.documentElement;
  const body = document.body;
  if (on) {
    root.style.setProperty("cursor", "grabbing", "important");
    if (body) body.style.setProperty("cursor", "grabbing", "important");
  } else {
    root.style.removeProperty("cursor");
    if (body) body.style.removeProperty("cursor");
  }
}

function clearWindowDragging() {
  if (Date.now() - dragStartedAt < WINDOW_DRAG_CLEAR_GRACE_MS) return;
  document.documentElement.removeAttribute(WINDOW_DRAGGING_ATTR);
  applyGrabbingCursor(false);
}

function ensureClearListeners() {
  if (clearBound) return;
  clearBound = true;
  window.addEventListener("pointerup", clearWindowDragging, true);
  window.addEventListener("mouseup", clearWindowDragging, true);
  window.addEventListener("blur", clearWindowDragging);
}

/** Mark the document as mid-drag so CSS / inline cursor show grabbing (not the text I-beam). */
export function markWindowDragging() {
  ensureClearListeners();
  dragStartedAt = Date.now();
  document.documentElement.setAttribute(WINDOW_DRAGGING_ATTR, "");
  applyGrabbingCursor(true);
}

/** Structural event shape — works for both DOM and React PointerEvents. */
type DragPointerEvent = {
  button: number;
  target: EventTarget | null;
  preventDefault(): void;
};

/**
 * Pointerdown handler for `.window-drag` regions. Filters interactive controls, suppresses
 * text-selection cursor, then hands off to the native start_dragging command.
 */
export function beginWindowDrag(event: DragPointerEvent): void {
  if (!isTauri() || !shouldStartWindowDrag(event)) return;
  // Avoid the I-beam / text-selection feedback on empty chrome and labels.
  event.preventDefault();
  markWindowDragging();
  void startWindowDrag();
}
