import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia; the shadcn/ui sidebar's mobile
// detection hook (useIsMobile) needs it to exist.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
