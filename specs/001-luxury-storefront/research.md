# Research: Luxury Storefront Refresh

## Decision: Use a boutique-light semantic token system

**Decision**: Replace ad hoc warm-neutral values with named roles for canvas, elevated surface, editorial dark, primary text, muted text, border, antique-bronze accent, and semantic status states.

**Rationale**: The project already centralizes most colors in `globals.css`, making a semantic layer the smallest way to align the entire storefront and dashboard while retaining the configurable brand accent.

**Alternatives considered**:

- A fully dark storefront: visually striking but reduces daylight readability and competes with product photography.
- Per-section gradients and unique palettes: would undermine the requested coherence and increase maintenance.

## Decision: Motion is transform and opacity only, with a single timing curve

**Decision**: Enhance the existing reveal mechanism and use shared transition primitives for hero entry, editorial reveal, images, and action affordances. Maintain a complete reduced-motion override.

**Rationale**: These properties are inexpensive to animate and a unified vocabulary looks more premium than unrelated effects.

**Alternatives considered**:

- Scroll-driven or continuously animated backgrounds: decorative rather than useful and inappropriate for reduced-motion users.
- A third-party animation runtime: unnecessary weight for the current scope.

## Decision: Reuse the existing protected media API

**Decision**: The client gallery loads the current authenticated media list and uploads one selected image at a time through the existing endpoint. The server response shape, validation, normalization, deduplication, authorization, and rate limit are unchanged.

**Rationale**: The existing pipeline already processes images securely. A client-only refresh retains those guarantees and avoids a data migration.

**Alternatives considered**:

- Direct browser-to-storage upload: would bypass established validation and change deployment security.
- A new gallery persistence table: not needed because media records already contain identifiers, dimensions, and usage count.

## Decision: Native drag reorder plus explicit move controls

**Decision**: Use native draggable cards for a pointer-friendly reorder gesture, backed by explicit “move earlier” and “move later” buttons with localized labels.

**Rationale**: The buttons give keyboard and touch users a reliable equivalent and remove the need for a drag-and-drop dependency.

**Alternatives considered**:

- Drag-only ordering: inaccessible and unreliable on touch devices.
- Adding a drag framework: disproportionate to a maximum of ten selected images.

## Decision: Add focused test tooling

**Decision**: Add only the test runner and React DOM test utilities necessary to prove selection behavior and uploader states, then use browser checks for the end-to-end flow.

**Rationale**: The repository has no current test script. Focused tests provide a repeatable regression net for capacity, deduplication, order, and failed uploads rather than relying only on manual checks.

**Alternatives considered**:

- Type-check and manual checks alone: cannot prove state transitions or prevent regressions.
- Broad end-to-end suite before the component is stable: slower to write and less precise for selection-state errors.
