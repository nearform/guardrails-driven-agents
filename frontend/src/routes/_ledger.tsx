import { createFileRoute, Outlet, useLoaderData } from "@tanstack/react-router";
import { listTransactionsFn } from "../features/transactions/server/listTransactions.functions";
import { TransactionsList } from "../features/transactions/components/TransactionsList";
import { NewTransactionDialog } from "../features/transactions/components/NewTransactionDialog";
import type { Transaction } from "../features/transactions/types.ts";

// Exported separately so it can be unit-tested against a stubbed server
// function without spinning up the router.
export async function transactionsLoader(): Promise<{
  transactions: Transaction[];
}> {
  const transactions = await listTransactionsFn();
  return { transactions };
}

// Pathless layout: it owns the transactions list and renders an <Outlet /> for
// child routes (currently just the empty index route at "/").
export const Route = createFileRoute("/_ledger")({
  // Reads go through a server function, so they run server-side even when the
  // loader re-runs in the browser (navigation / router.invalidate()).
  // Components never fetch — they read via useLoaderData().
  loader: transactionsLoader,
  component: LedgerLayout,
});

function LedgerLayout() {
  const { transactions } = useLoaderData({ from: "/_ledger" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Transactions</h1>
        <NewTransactionDialog />
      </div>
      <TransactionsList transactions={transactions} />
      <Outlet />
    </div>
  );
}
