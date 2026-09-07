import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionsList } from "../features/transactions/components/TransactionsList";
import type { Transaction } from "../features/transactions/types.ts";

function renderList(transactions: Transaction[]) {
  return render(<TransactionsList transactions={transactions} />);
}

// Stub the single `api` singleton — this is the only network seam the loader
// is allowed to use, so tests only ever need to fake this one module.
vi.mock("../features/common/api/client", () => ({
  api: {
    listTransactions: vi.fn(),
  },
}));

// `createServerFn`'s real implementation relies on TanStack Start's request-scoped
// AsyncLocalStorage, which only exists behind the framework's Vite/Nitro server
// runtime — not present in this Vitest/jsdom unit-test environment. We stub it
// with a faithful-enough fake (validator -> handler, both invoked the same way
// the real RPC does) so the test exercises the actual server-function module
// and its real `handler`, driving the mocked `api` beneath it.
vi.mock("@tanstack/react-start", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-start")>(
    "@tanstack/react-start",
  );
  return {
    ...actual,
    createServerFn: () => {
      let validate: ((data: unknown) => unknown) | undefined;
      const builder = {
        validator: (fn: (data: unknown) => unknown) => {
          validate = fn;
          return builder;
        },
        handler:
          (fn: (opts: { data: unknown }) => unknown) =>
          async (opts?: { data: unknown }) => {
            const data = validate ? validate(opts?.data) : opts?.data;
            return fn({ data });
          },
      };
      return builder;
    },
  };
});

describe("transactions loader + list", () => {
  it("renders a row per transaction returned by the stubbed api", async () => {
    const { api } = await import("../features/common/api/client");
    const { transactionsLoader } = await import("./_ledger");
    vi.mocked(api.listTransactions).mockResolvedValue({
      statusCode: 200,
      headers: {},
      body: [
        {
          id: "1",
          sender: "alice",
          beneficiary: "bob",
          amount: "42.50",
          currency: "EUR",
          description: "lunch",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const { transactions } = await transactionsLoader();
    renderList(transactions);

    expect(screen.getByTestId("transactions-list")).toBeInTheDocument();
    expect(screen.getAllByTestId("transaction-row")).toHaveLength(1);
    expect(screen.getByTestId("transaction-amount")).toHaveTextContent(
      "42.50 EUR",
    );
  });

  it("renders the empty state when there are no transactions", async () => {
    const { api } = await import("../features/common/api/client");
    const { transactionsLoader } = await import("./_ledger");
    vi.mocked(api.listTransactions).mockResolvedValue({
      statusCode: 200,
      headers: {},
      body: [],
    });

    const { transactions } = await transactionsLoader();
    renderList(transactions);

    expect(screen.getByTestId("transactions-empty-state")).toBeInTheDocument();
    expect(screen.queryByTestId("transactions-list")).not.toBeInTheDocument();
  });
});
