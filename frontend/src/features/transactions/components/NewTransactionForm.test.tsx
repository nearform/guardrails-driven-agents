import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { NewTransactionForm } from "./NewTransactionForm";

// Stub the single `api` singleton — the server function is the only module
// that imports it, but mocking here reaches it regardless of which module
// does the importing.
vi.mock("../../common/api/client", () => ({
  api: {
    createTransaction: vi.fn(),
    listTransactions: vi.fn(),
  },
}));

// `createServerFn`'s real implementation relies on TanStack Start's request-scoped
// AsyncLocalStorage, which only exists behind the framework's Vite/Nitro server
// runtime — not present in this Vitest/jsdom unit-test environment. We stub it
// with a faithful-enough fake (validator -> handler, both invoked the same way
// the real RPC does) so the test can exercise the actual server-function module
// and its real `handler`, focused on our behavior rather than Start's transport.
vi.mock("@tanstack/react-start", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-start")>(
    "@tanstack/react-start",
  );
  return {
    ...actual,
    createServerFn: () => {
      let validate: ((data: unknown) => unknown) | undefined;
      const builder = {
        validator: (fn: (data: unknown) => unknown) => {
          validate = fn;
          return builder;
        },
        handler:
          (fn: (opts: { data: unknown }) => unknown) =>
          async (opts: { data: unknown }) => {
            const data = validate ? validate(opts.data) : opts.data;
            return fn({ data });
          },
      };
      return builder;
    },
  };
});

// Mounts the form inside a router so `useRouter()` (and router.invalidate)
// works, passing an onSuccess spy the test can assert on.
function renderForm(onSuccess: () => void) {
  const rootRoute = createRootRoute({
    component: () => <NewTransactionForm onSuccess={onSuccess} />,
  });
  const routeTree = rootRoute.addChildren([]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return { router, ...render(<RouterProvider router={router} />) };
}

async function fillValidForm() {
  fireEvent.change(screen.getByTestId("field-sender"), {
    target: { value: "alice" },
  });
  fireEvent.change(screen.getByTestId("field-beneficiary"), {
    target: { value: "bob" },
  });
  fireEvent.change(screen.getByTestId("field-amount"), {
    target: { value: "42.50" },
  });
  fireEvent.change(screen.getByTestId("field-currency"), {
    target: { value: "EUR" },
  });
  fireEvent.change(screen.getByTestId("field-description"), {
    target: { value: "lunch" },
  });
}

describe("NewTransactionForm", () => {
  beforeEach(async () => {
    const { api } = await import("../../common/api/client");
    vi.mocked(api.createTransaction).mockReset();
    vi.mocked(api.listTransactions).mockReset();
  });

  it("submits valid input, invalidates the router, and calls onSuccess", async () => {
    const { api } = await import("../../common/api/client");
    vi.mocked(api.createTransaction).mockResolvedValue({
      statusCode: 201,
      headers: {},
      body: {
        id: "1",
        sender: "alice",
        beneficiary: "bob",
        amount: "42.50",
        currency: "EUR",
        description: "lunch",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });

    const onSuccess = vi.fn();
    const { router } = renderForm(onSuccess);
    await router.latestLoadPromise;
    const invalidate = vi.spyOn(router, "invalidate");

    await fillValidForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(api.createTransaction).toHaveBeenCalledWith({
        body: {
          sender: "alice",
          beneficiary: "bob",
          amount: "42.50",
          currency: "EUR",
          description: "lunch",
        },
      });
    });

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("blocks submit and shows inline field errors for invalid input", async () => {
    const { api } = await import("../../common/api/client");

    const onSuccess = vi.fn();
    const { router } = renderForm(onSuccess);
    await router.latestLoadPromise;

    // Leave sender/beneficiary empty, and use invalid amount/currency.
    fireEvent.change(screen.getByTestId("field-amount"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByTestId("field-currency"), {
      target: { value: "eur" },
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("error-sender")).toBeInTheDocument();
    expect(screen.getByTestId("error-beneficiary")).toBeInTheDocument();
    expect(screen.getByTestId("error-amount")).toBeInTheDocument();
    expect(screen.getByTestId("error-currency")).toBeInTheDocument();
    expect(api.createTransaction).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("surfaces the backend 400 detail without calling onSuccess", async () => {
    const { api } = await import("../../common/api/client");
    vi.mocked(api.createTransaction).mockResolvedValue({
      statusCode: 400,
      headers: {},
      body: {
        status_code: 400,
        detail: "amount must be positive",
      },
    });

    const onSuccess = vi.fn();
    const { router } = renderForm(onSuccess);
    await router.latestLoadPromise;

    await fillValidForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent(
      "amount must be positive",
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("treats an unexpected non-201/400 status as a failure, not a success", async () => {
    const { api } = await import("../../common/api/client");
    // The generated types only describe the documented 201/400 responses; an
    // undocumented 500 is exactly the case under test, so widen the stub.
    vi.mocked(api.createTransaction).mockResolvedValue({
      statusCode: 500,
      headers: {},
      body: { message: "internal server error" },
    } as unknown as Awaited<ReturnType<typeof api.createTransaction>>);

    const onSuccess = vi.fn();
    const { router } = renderForm(onSuccess);
    await router.latestLoadPromise;

    await fillValidForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("form-error")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
