import { createServerFn } from "@tanstack/react-start";
import { api } from "../../common/api/client";
import type { CreateTransactionRequest } from "@/generated-client/generated-client-types";

export const createTransactionFn = createServerFn({ method: "POST" })
  .validator((data: CreateTransactionRequest["body"]) => data)
  .handler(async ({ data }) => {
    return await api.createTransaction({ body: data });
  });
