import { useState } from "react";
import { Button } from "@/features/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/features/ui/components/dialog";
import { NewTransactionForm } from "./NewTransactionForm";

// Launches the create-transaction form in a modal. Open/close is local UI
// state — creation is intentionally not a route. On success the form
// invalidates the router (refreshing the list) and calls back to close here.
export function NewTransactionDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button data-testid="new-transaction-trigger" />}>
        New transaction
      </DialogTrigger>
      <DialogContent data-testid="new-transaction-dialog">
        <DialogHeader>
          <DialogTitle>New transaction</DialogTitle>
        </DialogHeader>
        <NewTransactionForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
