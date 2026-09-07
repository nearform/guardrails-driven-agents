from pathlib import Path
from typing import Any

from litestar import Response, get
import yaml

# The hand-written `openapi.yaml` (backend root) is the source of truth for the
# API contract: it is spec-first and intentionally documents planned endpoints
# that are not implemented yet. Litestar's own route-introspecting OpenAPI is
# therefore disabled in `create_app`; these handlers serve the static document
# instead. The file is read per request so edits show up without a restart.
OPENAPI_SPEC = Path(__file__).resolve().parents[2] / "openapi.yaml"

YAML_MEDIA_TYPE = "application/yaml"


@get("/schema/openapi.yaml", media_type=YAML_MEDIA_TYPE, sync_to_thread=True)
def openapi_yaml() -> Response[bytes]:
    """Serve the spec verbatim as YAML."""
    return Response(OPENAPI_SPEC.read_bytes(), media_type=YAML_MEDIA_TYPE)


@get("/schema/openapi.json", sync_to_thread=True)
def openapi_json() -> dict[str, Any]:
    """Serve the same spec as JSON (parsed from the YAML source)."""
    return yaml.safe_load(OPENAPI_SPEC.read_text())
