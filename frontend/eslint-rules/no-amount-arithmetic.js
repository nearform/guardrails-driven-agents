const ARITHMETIC_OPERATORS = new Set(["-", "*", "/", "%", "**"]);
const COERCION_CALLEES = new Set(["Number", "parseFloat", "parseInt"]);

function isAmountAccess(node) {
  return (
    node?.type === "MemberExpression" &&
    !node.computed &&
    node.property.type === "Identifier" &&
    node.property.name === "amount"
  );
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow numeric coercion of, or arithmetic on, a transaction's `amount` decimal string.",
    },
    schema: [],
    messages: {
      noAmountArithmetic:
        "`amount` is the API's decimal string — never coerce it to a number or " +
        "use it in arithmetic; floating-point rounding corrupts money. Render it " +
        "verbatim (e.g. {transaction.amount}); any money math belongs on the backend.",
    },
  },
  create(context) {
    function report(node) {
      context.report({ node, messageId: "noAmountArithmetic" });
    }

    return {
      // Number(x.amount), parseFloat(x.amount), parseInt(x.amount)
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          COERCION_CALLEES.has(node.callee.name) &&
          node.arguments.some(isAmountAccess)
        ) {
          report(node);
        }
      },
      // +x.amount
      UnaryExpression(node) {
        if (node.operator === "+" && isAmountAccess(node.argument)) {
          report(node);
        }
      },
      // x.amount * n, n - x.amount, ... ("+" is excluded: it is also string concat)
      BinaryExpression(node) {
        if (
          ARITHMETIC_OPERATORS.has(node.operator) &&
          (isAmountAccess(node.left) || isAmountAccess(node.right))
        ) {
          report(node);
        }
      },
    };
  },
};
