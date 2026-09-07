import type { Transaction } from "../types.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/ui/components/table";

const createdAtFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCreatedAt(iso: string): string {
  return createdAtFormatter.format(new Date(iso));
}

type TransactionsListProps = {
  transactions: Transaction[];
};

export function TransactionsList({ transactions }: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <p
        role="status"
        data-testid="transactions-empty-state"
        className="text-muted-foreground text-sm"
      >
        No transactions yet.
      </p>
    );
  }

  return (
    <Table aria-label="Transactions" data-testid="transactions-list">
      <TableHeader>
        <TableRow>
          <TableHead>Sender</TableHead>
          <TableHead>Beneficiary</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id} data-testid="transaction-row">
            <TableCell data-testid="transaction-sender" className="font-medium">
              {transaction.sender}
            </TableCell>
            <TableCell
              data-testid="transaction-beneficiary"
              className="font-medium"
            >
              {transaction.beneficiary}
            </TableCell>
            {/* amount is the API's decimal string, rendered verbatim: never
                Number()/parseFloat()'d, never used in arithmetic. */}
            <TableCell
              data-testid="transaction-amount"
              className="text-right tabular-nums"
            >
              {transaction.amount} {transaction.currency}
            </TableCell>
            <TableCell
              data-testid="transaction-description"
              className="text-muted-foreground"
            >
              {transaction.description ?? null}
            </TableCell>
            <TableCell className="text-muted-foreground">
              <time
                data-testid="transaction-created-at"
                dateTime={transaction.created_at}
              >
                {formatCreatedAt(transaction.created_at)}
              </time>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
