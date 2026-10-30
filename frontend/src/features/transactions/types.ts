import type {
  GetTransactionResponseOK,
  ListTransactionsResponseOK,
} from "@/generated-client/generated-client-types";

export type Transaction = ListTransactionsResponseOK[number];
export type TransactionDetail = GetTransactionResponseOK;
