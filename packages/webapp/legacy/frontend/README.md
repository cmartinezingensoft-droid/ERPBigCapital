# Legacy frontend modules

## Projects

The Projects frontend was moved out of `src` during Phase 1 hardening. The current backend does not expose the legacy `/projects` API used by this code, so keeping the screens routable caused dead UI and runtime 404s.

The source is preserved here for a future, explicit Projects restoration. Database `projectId` fields and historical project tables were intentionally **not** removed. This directory is outside the webapp TypeScript `include: ["src"]` and is not part of the production build.
