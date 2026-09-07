import { createServerFn } from "@tanstack/react-start";
import { api } from "../../common/api/client";

export const listTransactionsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await api.listTransactions({});
    return response.body;
  },
);
