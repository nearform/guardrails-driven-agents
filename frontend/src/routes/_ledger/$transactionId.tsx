import { createFileRoute } from "@tanstack/react-router";
import { TransactionDetailDialog } from "../../features/transactions/components/TransactionDetailDialog";

// Child of the `_ledger` layout, rendered through its <Outlet /> on top of the
// list. The modal loads its own data.
export const Route = createFileRoute("/_ledger/$transactionId")({
  component: TransactionDetailRoute,
});

function TransactionDetailRoute() {
  const { transactionId } = Route.useParams();
  return <TransactionDetailDialog transactionId={transactionId} />;
}
