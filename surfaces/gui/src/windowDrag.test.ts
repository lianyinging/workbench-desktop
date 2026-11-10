import { afterEach, describe, expect, it, vi } from "vitest";
import {
  beginWindowDrag,
  markWindowDragging,
  shouldStartWindowDrag,
  WINDOW_DRAG_CLEAR_GRACE_MS,
  WINDOW_DRAG_CLASS,
  WINDOW_DRAG_LABEL_CLASS,
  WINDOW_DRAGGING_ATTR,
} from "./windowDrag";

vi.mock("./tauri", () => ({
  isTauri: () => true,
  startWindowDrag: vi.fn(() => Promise.resolve(true)),
}));

import { startWindowDrag } from "./tauri";

const press = (target: EventTarget | null, button = 0) => ({ button, target });

describe("shouldStartWindowDrag", () => {
  it("drags from empty title-bar space", () => {
    expect(shouldStartWindowDrag(press(document.createElement("div")))).toBe(true);
  });

  it.each([
    '<button><svg><path /></svg></button>',
    '<a href="#"><span>link</span></a>',
    '<span role="button"><span>button</span></span>',
    '<span role="menuitem">item</span>',
    '<span role="link">link</span>',
    '<input />',
    '<textarea></textarea>',
    '<select><option>option</option></select>',
    '<label><span>label</span></label>',
    '<div contenteditable="true"><span>edit</span></div>',
  ])("does not start a native drag from an interactive control: %s", (html) => {
    const bar = document.createElement("div");
    bar.innerHTML = html;
    for (const target of bar.querySelectorAll("*")) {
      expect(shouldStartWindowDrag(press(target))).toBe(false);
    }
  });

  it.each([1, 2])("ignores mouse button %s", (button) => {
    expect(shouldStartWindowDrag(press(document.createElement("div"), button))).toBe(false);
  });

  it("tolerates targets without closest", () => {
    expect(shouldStartWindowDrag(press(null))).toBe(true);
    expect(shouldStartWindowDrag(press(document.createTextNode("title")))).toBe(true);
  });
});

describe("window-drag class names", () => {
  it("exports stable CSS class tokens", () => {
    expect(WINDOW_DRAG_CLASS).toBe("window-drag");
    expect(WINDOW_DRAG_LABEL_CLASS).toBe("window-drag-label");
  });
});

describe("markWindowDragging", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(WINDOW_DRAGGING_ATTR);
    document.documentElement.style.removeProperty("cursor");
    vi.useRealTimers();
  });

  it("sets the dragging attribute used by CSS", () => {
    markWindowDragging();
    expect(document.documentElement.hasAttribute(WINDOW_DRAGGING_ATTR)).toBe(true);
  });

  it("ignores the synthetic pointerup right after start_dragging", () => {
    markWindowDragging();
    window.dispatchEvent(new Event("pointerup"));
    expect(document.documentElement.hasAttribute(WINDOW_DRAGGING_ATTR)).toBe(true);
  });

  it("clears on pointerup after the grace window", () => {
    vi.useFakeTimers();
    markWindowDragging();
    vi.advanceTimersByTime(WINDOW_DRAG_CLEAR_GRACE_MS);
    window.dispatchEvent(new Event("pointerup"));
    expect(document.documentElement.hasAttribute(WINDOW_DRAGGING_ATTR)).toBe(false);
    expect(document.documentElement.style.cursor).toBe("");
  });

  it("forces an inline grabbing cursor while dragging", () => {
    markWindowDragging();
    expect(document.documentElement.style.cursor).toBe("grabbing");
  });
});

describe("beginWindowDrag", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(WINDOW_DRAGGING_ATTR);
    document.documentElement.style.removeProperty("cursor");
    vi.mocked(startWindowDrag).mockClear();
  });

  const pointerDown = (target: EventTarget) => {
    // jsdom lacks PointerEvent — a MouseEvent with the same fields is enough for our handler.
    const event = new MouseEvent("pointerdown", { button: 0, bubbles: true }) as PointerEvent;
    Object.defineProperty(event, "target", { value: target });
    return event;
  };

  it("starts a native drag from empty chrome", () => {
    const event = pointerDown(document.createElement("div"));
    const prevent = vi.spyOn(event, "preventDefault");
    beginWindowDrag(event);
    expect(prevent).toHaveBeenCalled();
    expect(document.documentElement.hasAttribute(WINDOW_DRAGGING_ATTR)).toBe(true);
    expect(startWindowDrag).toHaveBeenCalled();
  });

  it("does not drag from a button", () => {
    beginWindowDrag(pointerDown(document.createElement("button")));
    expect(document.documentElement.hasAttribute(WINDOW_DRAGGING_ATTR)).toBe(false);
    expect(startWindowDrag).not.toHaveBeenCalled();
  });
});
