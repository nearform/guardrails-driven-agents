import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/features/common/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/dialog";
import type { TransactionDetail } from "../types.ts";

type TransactionDetailDialogProps = {
  transactionId: string;
};

type DetailState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ready"; transaction: TransactionDetail };

const createdAtFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

// Shows one transaction in a modal. Closing the modal navigates back to the
// list route.
export function TransactionDetailDialog({
  transactionId,
}: TransactionDetailDialogProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    api
      .getTransaction({ path: { id: transactionId } })
      .then((response) => {
        if (cancelled) return;
        if (response.statusCode === 200) {
          setState({ status: "ready", transaction: response.body });
        } else if (response.statusCode === 404) {
          setState({ status: "not-found" });
        } else {
          setState({ status: "error" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

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
        {state.status === "loading" && (
          <p role="status" className="text-muted-foreground text-sm">
            Loading…
          </p>
        )}
        {state.status === "not-found" && (
          <p role="alert" data-testid="transaction-detail-not-found">
            Transaction not found.
          </p>
        )}
        {state.status === "error" && (
          <p role="alert" data-testid="transaction-detail-error">
            Could not load the transaction.
          </p>
        )}
        {state.status === "ready" && (
          <dl
            className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm"
            data-testid="transaction-detail"
          >
            <dt className="text-muted-foreground">Sender</dt>
            <dd data-testid="detail-sender">{state.transaction.sender}</dd>
            <dt className="text-muted-foreground">Beneficiary</dt>
            <dd data-testid="detail-beneficiary">
              {state.transaction.beneficiary}
            </dd>
            <dt className="text-muted-foreground">Amount</dt>
            <dd data-testid="detail-amount" className="tabular-nums">
              {Number(state.transaction.amount).toFixed(2)}{" "}
              {state.transaction.currency}
            </dd>
            <dt className="text-muted-foreground">Description</dt>
            <dd data-testid="detail-description">
              {state.transaction.description ?? "—"}
            </dd>
            <dt className="text-muted-foreground">Date</dt>
            <dd data-testid="detail-created-at">
              {createdAtFormatter.format(new Date(state.transaction.created_at))}
            </dd>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
