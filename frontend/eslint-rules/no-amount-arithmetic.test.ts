import { RuleTester } from "eslint";
import rule from "./no-amount-arithmetic.js";

// ESLint's RuleTester binds to the global describe/it, which Vitest provides
// because vitest.config.ts sets `globals: true`.
const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-amount-arithmetic", rule, {
  valid: [
    // Rendered / passed verbatim — the correct usage.
    "foo(transaction.amount);",
    "const label = `${transaction.amount} EUR`;",
    'const label = transaction.amount + " EUR";', // string concat, not arithmetic
    "const x = order.total * 2;", // arithmetic on a different property
    "const a = transaction.amount;",
  ],
  invalid: [
    {
      code: "const n = Number(transaction.amount);",
      errors: [{ messageId: "noAmountArithmetic" }],
    },
    {
      code: "const n = parseFloat(transaction.amount);",
      errors: [{ messageId: "noAmountArithmetic" }],
    },
    {
      code: "const n = parseInt(t.amount);",
      errors: [{ messageId: "noAmountArithmetic" }],
    },
    {
      code: "const n = +transaction.amount;",
      errors: [{ messageId: "noAmountArithmetic" }],
    },
    {
      code: "const withTax = transaction.amount * 1.2;",
      errors: [{ messageId: "noAmountArithmetic" }],
    },
    {
      code: "const diff = total - transaction.amount;",
      errors: [{ messageId: "noAmountArithmetic" }],
    },
  ],
});
