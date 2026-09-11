"""Pure source-level architecture checks with no database dependency."""

import ast
from enum import Enum, auto
from pathlib import Path

import pytest

APP_DIR = Path(__file__).resolve().parents[1] / "app"

# Litestar route-handler decorators. A function decorated with one of these
# (resolved from the file's own litestar imports) is an HTTP/websocket handler.
ROUTE_DECORATORS = frozenset(
    {
        "get",
        "post",
        "put",
        "patch",
        "delete",
        "route",
        "head",
        "websocket",
        "websocket_listener",
        "asgi",
    }
)


def parse(path: Path) -> ast.Module:
    """Read and parse a Python source file into a syntax tree."""
    return ast.parse(path.read_text(), filename=str(path))


def files_named(name: str) -> list[Path]:
    """All `app/` source files whose filename equals `name`."""
    return sorted(APP_DIR.rglob(name))


def rel(path: Path) -> str:
    """Path relative to the backend root, for readable test ids/messages."""
    return str(path.relative_to(APP_DIR.parent))


# --- Rule 1: controllers import `app` code only from a `use_cases` module --------


class AppImport(Enum):
    """How a controller's import relates to the `app` package."""

    IRRELEVANT = auto()  # does not touch the `app` package
    USE_CASES = auto()  # allowed: imported via a `use_cases` module
    VIOLATION = auto()  # reaches past use_cases into the app package


def _classify_app_import(node: ast.ImportFrom | ast.Import) -> AppImport:
    """Classify an import node for the controller rule."""
    if isinstance(node, ast.ImportFrom):
        # Relative imports (level > 0) have no explicit `app` prefix; the slices
        # use absolute imports, so treat any relative import as out of scope.
        if node.level or not node.module or not node.module.split(".")[0] == "app":
            return AppImport.IRRELEVANT
        if "use_cases" in node.module.split("."):
            return AppImport.USE_CASES
        # `from app.transactions import use_cases`
        if all(alias.name == "use_cases" for alias in node.names):
            return AppImport.USE_CASES
        return AppImport.VIOLATION

    # ast.Import: `import app.transactions.use_cases`
    app_aliases = [a for a in node.names if a.name.split(".")[0] == "app"]
    if not app_aliases:
        return AppImport.IRRELEVANT
    if all("use_cases" in a.name.split(".") for a in app_aliases):
        return AppImport.USE_CASES
    return AppImport.VIOLATION


@pytest.mark.parametrize("controller", files_named("controller.py"), ids=rel)
def test_controllers_import_app_code_only_from_use_cases(controller: Path) -> None:
    __tracebackhide__ = True
    tree = parse(controller)
    violations = []
    for node in ast.walk(tree):
        if not isinstance(node, (ast.Import, ast.ImportFrom)):
            continue
        if _classify_app_import(node) is AppImport.VIOLATION:
            violations.append(f"{rel(controller)}:{node.lineno} -> {ast.unparse(node)}")
    if violations:
        pytest.fail(
            f"Slice boundary violated in {rel(controller)}.\n"
            "\n"
            "Rule: a controller may import code from the `app` package only through "
            "a `use_cases` module. Controllers wire HTTP to the slice's use cases; "
            "they must not reach past them into repositories, tables, db, or sibling "
            "slices.\n"
            "\n"
            "Offending imports:\n" + "\n".join(f"  {v}" for v in violations) + "\n\n"
            "Fix: route the needed symbol through the slice's `use_cases` module "
            "(e.g. re-export or define it there, then `from app.<slice> import "
            "use_cases` and reference `use_cases.<name>`). Imports from outside `app` "
            "(litestar, piccolo, stdlib) are unrestricted."
        )


# --- Rule 2: repositories are functions only, keyword-only params, `db` first ----


def _signature_violation(node: ast.FunctionDef | ast.AsyncFunctionDef) -> str | None:
    """Describe how a repository function's signature breaks the rule, or None.

    Every parameter must be keyword-only — declared with `*, db, ...` — so there
    may be no positional parameters and `db` must be the first keyword-only one.
    """
    args = node.args
    if args.posonlyargs or args.args:
        positional = [a.arg for a in args.posonlyargs + args.args]
        return (
            f"`{node.name}` declares positional parameters {positional}; every "
            f"parameter must be keyword-only. Add a leading `*` so the signature "
            f"reads `def {node.name}(*, db, ...)`."
        )
    kwonly = [a.arg for a in args.kwonlyargs]
    if not kwonly:
        return (
            f"`{node.name}` takes no parameters; a repository function must take "
            f"the engine as its first keyword-only parameter: "
            f"`def {node.name}(*, db, ...)`."
        )
    if kwonly[0] != "db":
        return (
            f"`{node.name}` first keyword-only parameter is {kwonly[0]!r}; it must "
            f"be `db` (the engine). Reorder to `def {node.name}(*, db, ...)`."
        )
    return None


@pytest.mark.parametrize("repo", files_named("repository.py"), ids=rel)
def test_repositories_are_functions_with_kwonly_db_first(repo: Path) -> None:
    __tracebackhide__ = True
    tree = parse(repo)
    violations = []

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            violations.append(
                f"{rel(repo)}:{node.lineno} -> `class {node.name}` is not allowed; "
                "a repository is a module of plain functions, not a class."
            )

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            problem = _signature_violation(node)
            if problem:
                violations.append(f"{rel(repo)}:{node.lineno} -> {problem}")

    if violations:
        pytest.fail(
            f"Repository shape violated in {rel(repo)}.\n"
            "\n"
            "Rule: a repository is a module of plain functions (no classes), and "
            "every function takes the engine as a keyword-only first parameter — "
            "declared `def name(*, db, ...)`. Keeping `db` keyword-only forces call "
            "sites to name it (`repository.name(db=db, ...)`), so the dependency is "
            "explicit and never passed positionally by accident.\n"
            "\n"
            "Offending definitions:\n"
            + "\n".join(f"  {v}" for v in violations)
            + "\n\n"
            "Fix: make the repository a module of plain functions (no classes) and "
            "give each one a leading keyword-only `db` parameter — declared "
            "`def name(*, db, ...)`. The per-definition notes above name the exact "
            "change for each offender."
        )


# --- Rule 3: Litestar route handlers live only in `controller.py` files ---------


def _litestar_route_names(tree: ast.Module) -> set[str]:
    """Local names bound to a litestar route decorator in this file.

    Resolves the file's own `litestar` imports so a `@get` from an unrelated
    library is never mistaken for a route handler. Tracks `as` aliases too.
    """
    names: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            root = (node.module or "").split(".")[0]
            if root != "litestar":
                continue
            for alias in node.names:
                if alias.name in ROUTE_DECORATORS:
                    names.add(alias.asname or alias.name)
    return names


def _decorator_root_name(decorator: ast.expr) -> str | None:
    """Reduce a decorator expression to its root identifier.

    Handles `@get` (Name), `@get(...)` (Call) and `@litestar.get` (Attribute).
    """
    node = decorator
    if isinstance(node, ast.Call):
        node = node.func
    if isinstance(node, ast.Attribute):
        return node.attr
    if isinstance(node, ast.Name):
        return node.id
    return None


@pytest.mark.parametrize("source", sorted(APP_DIR.rglob("*.py")), ids=rel)
def test_route_handlers_only_in_controller_files(source: Path) -> None:
    __tracebackhide__ = True
    tree = parse(source)
    route_names = _litestar_route_names(tree)

    handlers = []
    for node in tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        if any(_decorator_root_name(dec) in route_names for dec in node.decorator_list):
            handlers.append(node.name)

    if handlers and source.name != "controller.py":
        pytest.fail(
            f"Misplaced route handler(s) in {rel(source)}.\n"
            "\n"
            "Rule: functions decorated with a Litestar route decorator "
            "(@get/@post/@put/@patch/@delete/@route/...) may live only in a file "
            "named `controller.py`. This keeps the HTTP surface of every slice in "
            "one predictable place. `main.py` only imports and registers handlers "
            "defined there.\n"
            "\n"
            f"Handlers defined here: {handlers}\n"
            "\n"
            "Fix: move these handlers into the slice's `controller.py` (or rename "
            "this file to `controller.py` if it is the slice's controller), and "
            "have the non-controller module expose plain functions instead."
        )
