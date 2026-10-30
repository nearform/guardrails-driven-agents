import { createServerFn } from "@tanstack/react-start";
import { api } from "../../common/api/client";

// Resolves to null when no transaction exists with that id.
export const getTransactionFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const response = await api.getTransaction({ path: { id: data.id } });
    return response.statusCode === 200 ? response.body : null;
  });
