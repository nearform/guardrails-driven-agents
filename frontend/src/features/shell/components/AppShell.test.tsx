import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "./AppShell";

const MENU_COLLAPSED_KEY = "ledger:menu-collapsed";

function buildTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <div data-testid="page-content" />
      </AppShell>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
  });

  const routeTree = rootRoute.addChildren([indexRoute]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it("toggles the menu and persists the choice to localStorage", async () => {
    const router = buildTestRouter("/");
    render(<RouterProvider router={router} />);
    await router.latestLoadPromise;

    const menu = await screen.findByTestId("app-menu");
    expect(menu).toHaveAttribute("data-collapsed", "false");

    fireEvent.click(screen.getByTestId("menu-toggle"));

    expect(menu).toHaveAttribute("data-collapsed", "true");
    expect(window.localStorage.getItem(MENU_COLLAPSED_KEY)).toBe("true");
  });

  it("restores the collapsed state from localStorage on load", async () => {
    window.localStorage.setItem(MENU_COLLAPSED_KEY, "true");
    const router = buildTestRouter("/");
    render(<RouterProvider router={router} />);
    await router.latestLoadPromise;

    expect(await screen.findByTestId("app-menu")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });

  it("highlights the active section", async () => {
    const router = buildTestRouter("/");
    render(<RouterProvider router={router} />);
    await router.latestLoadPromise;

    const links = screen.getAllByTestId(/^menu-link-/);
    expect(links).toHaveLength(1);
    expect(await screen.findByTestId("menu-link-/")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
