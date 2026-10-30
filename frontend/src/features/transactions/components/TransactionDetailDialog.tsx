import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/dialog";
import type { TransactionDetail } from "../types.ts";

type TransactionDetailDialogProps = {
  transaction: TransactionDetail | null;
};

const createdAtFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

// Shows one transaction in a modal. Closing the modal navigates back to the
// list route.
export function TransactionDetailDialog({
  transaction,
}: TransactionDetailDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void navigate({ to: "/" });
      }}
    >
      <DialogContent data-testid="transaction-detail-dialog">
        <DialogHeader>
          <DialogTitle>Transaction details</DialogTitle>
        </DialogHeader>
        {transaction === null ? (
          <p role="alert" data-testid="transaction-detail-not-found">
            Transaction not found.
          </p>
        ) : (
          <dl
            className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm"
            data-testid="transaction-detail"
          >
            <dt className="text-muted-foreground">Sender</dt>
            <dd data-testid="detail-sender">{transaction.sender}</dd>
            <dt className="text-muted-foreground">Beneficiary</dt>
            <dd data-testid="detail-beneficiary">{transaction.beneficiary}</dd>
            <dt className="text-muted-foreground">Amount</dt>
            <dd data-testid="detail-amount" className="tabular-nums">
              {transaction.amount} {transaction.currency}
            </dd>
            <dt className="text-muted-foreground">Description</dt>
            <dd data-testid="detail-description">
              {transaction.description ?? "—"}
            </dd>
            <dt className="text-muted-foreground">Date</dt>
            <dd data-testid="detail-created-at">
              {createdAtFormatter.format(new Date(transaction.created_at))}
            </dd>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
