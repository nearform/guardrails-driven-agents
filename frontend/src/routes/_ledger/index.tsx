import { createFileRoute } from "@tanstack/react-router";

// The list itself lives in the `_ledger` layout, so the home route renders
// nothing extra — the layout's <Outlet /> is simply empty at "/".
export const Route = createFileRoute("/_ledger/")({
  component: () => null,
});
