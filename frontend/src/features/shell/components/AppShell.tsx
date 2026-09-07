import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { PanelLeftIcon } from "lucide-react";
import { Button } from "@/features/ui/components/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/features/ui/components/sidebar";

const MENU_COLLAPSED_KEY = "ledger:menu-collapsed";

const NAV_LINKS = [{ to: "/", label: "Transactions" }];

function readPersistedCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MENU_COLLAPSED_KEY) === "true";
}

// The app shell is pure chrome: a header (app name links home + menu toggle)
// and a collapsible left menu (shadcn/ui sidebar primitive). It fetches nothing.
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(readPersistedCollapsed);
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    window.localStorage.setItem(MENU_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div data-testid="app-shell" className="flex min-h-svh flex-col">
      <SidebarProvider
        open={!collapsed}
        onOpenChange={(open) => setCollapsed(!open)}
        className="min-h-0 flex-1"
      >
        <Sidebar>
          <SidebarHeader />
          <SidebarContent>
            <nav
              data-testid="app-menu"
              data-collapsed={collapsed}
              aria-label="Main"
            >
              <SidebarMenu>
                {NAV_LINKS.map((link) => {
                  const active = currentPath === link.to;
                  return (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton
                        isActive={active}
                        render={
                          <Link
                            to={link.to}
                            data-testid={`menu-link-${link.to}`}
                            aria-current={active ? "page" : undefined}
                            data-active={active}
                          />
                        }
                      >
                        {link.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarContent>
        </Sidebar>
        <SidebarInset data-testid="app-content" className="p-4">
          <header
            data-testid="app-header"
            className="flex items-center gap-2 border-b p-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              data-testid="menu-toggle"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((value) => !value)}
            >
              <PanelLeftIcon />
              <span className="sr-only">
                {collapsed ? "Expand menu" : "Collapse menu"}
              </span>
            </Button>
            <Link to="/" data-testid="app-home-link" className="font-semibold">
              Ledger
            </Link>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
