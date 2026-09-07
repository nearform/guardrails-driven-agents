import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";
import { createTransactionFn } from "../server/createTransaction.functions";

// Field validators mirror the OpenAPI `TransactionCreate` contract exactly.
const AMOUNT_PATTERN = /^(?!0+(\.0+)?$)\d{1,10}(\.\d{1,2})?$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DESCRIPTION_MAX_LENGTH = 255;

const SENDER_REQUIRED = "Sender is required.";
const BENEFICIARY_REQUIRED = "Beneficiary is required.";
const AMOUNT_INVALID =
  "Enter a positive amount with up to 10 integer and 2 fractional digits (e.g. 42.50).";
const CURRENCY_INVALID = "Enter a 3-letter uppercase currency code (e.g. EUR).";
const DESCRIPTION_TOO_LONG = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;

type FormValues = {
  sender: string;
  beneficiary: string;
  amount: string;
  currency: string;
  description: string;
};

const defaultValues: FormValues = {
  sender: "",
  beneficiary: "",
  amount: "",
  currency: "",
  description: "",
};

export function NewTransactionForm({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setFormError(null);

      const result = await createTransactionFn({
        data: {
          sender: value.sender,
          beneficiary: value.beneficiary,
          amount: value.amount,
          currency: value.currency,
          description: value.description.trim() ? value.description : undefined,
        },
      });

      if (result.statusCode !== 201) {
        setFormError(
          result.statusCode === 400
            ? result.body.detail
            : "Something went wrong creating the transaction. Please try again.",
        );
        return;
      }

      await router.invalidate();
      onSuccess?.();
    },
  });

  return (
    <form
      data-testid="new-transaction-form"
      className="flex max-w-md flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        // Force every field to validate (and surface its own error) before
        // handleSubmit's internal check runs — otherwise a field that failed
        // validation earlier (e.g. on change) short-circuits the submit
        // before untouched fields ever get a chance to validate themselves.
        void form.validateAllFields("submit").then(() => form.handleSubmit());
      }}
    >
      <form.Field
        name="sender"
        validators={{
          onChange: ({ value }) =>
            value.trim() === "" ? SENDER_REQUIRED : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm font-medium">
              Sender
            </label>
            <Input
              id={field.name}
              name={field.name}
              data-testid="field-sender"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length > 0 ? (
              <span
                role="alert"
                data-testid="error-sender"
                className="text-destructive text-sm"
              >
                {field.state.meta.errors.join(", ")}
              </span>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="beneficiary"
        validators={{
          onChange: ({ value }) =>
            value.trim() === "" ? BENEFICIARY_REQUIRED : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm font-medium">
              Beneficiary
            </label>
            <Input
              id={field.name}
              name={field.name}
              data-testid="field-beneficiary"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length > 0 ? (
              <span
                role="alert"
                data-testid="error-beneficiary"
                className="text-destructive text-sm"
              >
                {field.state.meta.errors.join(", ")}
              </span>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="amount"
        validators={{
          onChange: ({ value }) =>
            AMOUNT_PATTERN.test(value) ? undefined : AMOUNT_INVALID,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm font-medium">
              Amount
            </label>
            <Input
              id={field.name}
              name={field.name}
              data-testid="field-amount"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length > 0 ? (
              <span
                role="alert"
                data-testid="error-amount"
                className="text-destructive text-sm"
              >
                {field.state.meta.errors.join(", ")}
              </span>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="currency"
        validators={{
          onChange: ({ value }) =>
            CURRENCY_PATTERN.test(value) ? undefined : CURRENCY_INVALID,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm font-medium">
              Currency
            </label>
            <Input
              id={field.name}
              name={field.name}
              data-testid="field-currency"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length > 0 ? (
              <span
                role="alert"
                data-testid="error-currency"
                className="text-destructive text-sm"
              >
                {field.state.meta.errors.join(", ")}
              </span>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="description"
        validators={{
          onChange: ({ value }) =>
            value.length > DESCRIPTION_MAX_LENGTH
              ? DESCRIPTION_TOO_LONG
              : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm font-medium">
              Description
            </label>
            <Input
              id={field.name}
              name={field.name}
              data-testid="field-description"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length > 0 ? (
              <span
                role="alert"
                data-testid="error-description"
                className="text-destructive text-sm"
              >
                {field.state.meta.errors.join(", ")}
              </span>
            ) : null}
          </div>
        )}
      </form.Field>

      {formError ? (
        <p
          role="alert"
          data-testid="form-error"
          className="text-destructive text-sm"
        >
          {formError}
        </p>
      ) : null}

      <Button type="submit" data-testid="submit-button" className="self-start">
        Create transaction
      </Button>
    </form>
  );
}
