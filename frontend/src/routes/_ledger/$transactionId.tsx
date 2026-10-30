import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { getTransactionFn } from "../../features/transactions/server/getTransaction.functions";
import { TransactionDetailDialog } from "../../features/transactions/components/TransactionDetailDialog";
import type { TransactionDetail } from "../../features/transactions/types.ts";

// Exported separately so it can be unit-tested against a stubbed server
// function without spinning up the router.
export async function transactionDetailLoader({
  params,
}: {
  params: { transactionId: string };
}): Promise<{ transaction: TransactionDetail | null }> {
  const transaction = await getTransactionFn({
    data: { id: params.transactionId },
  });
  return { transaction };
}

// Child of the `_ledger` layout, rendered through its <Outlet /> on top of the
// list.
export const Route = createFileRoute("/_ledger/$transactionId")({
  loader: transactionDetailLoader,
  component: TransactionDetailRoute,
});

function TransactionDetailRoute() {
  const { transaction } = useLoaderData({ from: "/_ledger/$transactionId" });
  return <TransactionDetailDialog transaction={transaction} />;
}
