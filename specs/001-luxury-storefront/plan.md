# Implementation Plan: Luxury Storefront Refresh

**Branch**: `main` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-luxury-storefront/spec.md`

## Summary

Refresh the store into the approved boutique-light luxury direction and make its motion, page hierarchy, and dashboard image selection feel deliberate in Arabic and English. Establish semantic visual tokens, use a small reusable motion vocabulary, elevate the home page and shared storefront surfaces, and replace the primitive uploader with one reusable media-selection experience. The protected media pipeline remains unchanged: the work is client experience and component composition, not a replacement for validation or storage.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Next.js 15

**Primary Dependencies**: Next.js, next-intl, Zustand, Tailwind CSS 4; add Vitest and React Testing Library only for targeted client-component and helper behavior tests.

**Storage**: Existing SQLite media records and local processed image files; no schema or persistence changes.

**Testing**: New focused Vitest tests for media-selection helpers and uploader state; production type validation and build; Playwright browser checks for Arabic/English rendering, motion reduction, gallery selection, and file upload interaction.

**Target Platform**: Modern desktop and mobile browsers; deployed as the existing Railway service.

**Project Type**: Full-stack web application with storefront, authenticated admin dashboard, and API routes in one project.

**Performance Goals**: Avoid adding blocking startup work; keep home images responsive through the existing image delivery route; animate only opacity and transforms; load the gallery only after an administrator opens it.

**Constraints**: Preserve protected upload processing, the 8 MB input limit, current max-image limits, server rate limits, bilingual directionality, semantic focus states, and reduced-motion support. Do not introduce placeholder content or a new client image-processing dependency.

**Scale/Scope**: Shared CSS tokens; all storefront routes through shared components; homepage sections; all dashboard forms that currently select one or many images; up to 200 existing assets in the administrator gallery.

## Constitution Check

The generated constitution is an uncustomized template, so the repository’s `AGENTS.md` quality bar governs this feature. The plan passes its gates:

- The existing TypeScript, Next.js, i18n, media, and deployment conventions are retained.
- New behavior is planned test-first, followed by type, build, and browser verification.
- Keyboard access, focus visibility, contrast, Arabic RTL, English LTR, and reduced-motion behavior are first-class acceptance requirements.
- Uploads retain existing authorization, validation, transformation, deduplication, and rate limiting; no secrets or new privileged paths are introduced.
- The design stays a small set of local components and does not add a gallery service or third-party drag-and-drop framework.

## Project Structure

### Documentation

```text
specs/001-luxury-storefront/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── media-gallery.md
└── tasks.md
```

### Source Code

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── (storefront)/
│   │   └── (admin)/
│   └── api/admin/media/
├── components/
│   ├── admin/
│   │   ├── ImageUploader.tsx
│   │   ├── MediaGalleryDialog.tsx        # new reusable authenticated gallery
│   │   ├── SingleImageInput.tsx
│   │   └── media-selection.ts            # new testable selection helpers
│   ├── storefront/
│   │   ├── home/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ProductCard.tsx
│   └── ui/
│       ├── Reveal.tsx
│       └── Icons.tsx
├── lib/
│   └── admin-client.ts
└── styles/
    └── globals.css

tests/
├── unit/
│   └── media-selection.test.ts
└── components/
    └── ImageUploader.test.tsx
```

**Structure Decision**: Extend the existing shared style sheet and component system. One new dialog and a small pure helper module serve every single- and multi-image control, avoiding duplicate gallery and ordering behavior across forms.

## Implementation Sequence

1. Establish the boutique-light token system and reusable motion primitives, then apply them to shared storefront and admin surfaces.
2. Refine the home hero and editorial sections with a single visual rhythm, staged reveal timing, and image interaction that works without hover.
3. Add focused test infrastructure and a pure selection-state module; write failing tests before implementing selection, capacity, duplicate, and order behavior.
4. Build the reusable gallery dialog and upgraded multi-image uploader with previews, resilient sequential upload feedback, drag reorder plus accessible move controls, and gallery selection.
5. Route every existing single-image and multi-image dashboard field through the shared experience, preserving each form’s selected IDs and capacity.
6. Verify the media API contract remains compatible, run type/build/browser checks, capture the revised interface, and create a clean deployment ZIP.

## Complexity Tracking

No constitution violations require justification.
