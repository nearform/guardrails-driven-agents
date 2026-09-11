#!/usr/bin/env bash
# PostToolUse hook: run the guardrail covering the edited file. Failures go to
# stderr with exit 2, which hands the diagnostic back to Claude Code.
#
#   backend/**/*.py                    -> just backend-architecture-test
#   frontend/src/**/*.{ts,tsx,js,jsx}  -> just frontend-lint

set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 1

file="$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')"
rel="${file#"$PWD"/}"

# `*` matches `/` in a case pattern, so these cover nested files too.
case "$rel" in
backend/*.py) check=backend-architecture-test ;;
frontend/src/*.ts | frontend/src/*.tsx | frontend/src/*.js | frontend/src/*.jsx) check=frontend-lint ;;
*) exit 0 ;;
esac

output="$(just "$check" 2>&1)"
status=$?

[ "$status" -eq 0 ] && exit 0

# 127 is a missing toolchain, not a guardrail failure: report it without asking
# for a fix.
if [ "$status" -eq 127 ]; then
	printf 'guardrails hook: skipped %s, toolchain missing\n%s\n' "$check" "$output" >&2
	exit 1
fi

printf 'A guardrail failed on %s. Fix it using the reason below.\n\n%s\n' "$rel" "$output" >&2
exit 2
