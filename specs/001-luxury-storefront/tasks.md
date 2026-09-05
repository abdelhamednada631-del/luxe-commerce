# Tasks: Luxury Storefront Refresh

**Input**: Design documents from `/specs/001-luxury-storefront/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/admin-media-gallery.md`, and `quickstart.md`

**Tests**: Required. New selection logic and gallery/upload behavior follow test-first development; visual behavior is verified in a real browser after component work.

## Phase 1: Setup

**Purpose**: Establish focused repeatable tests without changing production behavior.

- [ ] T001 Add the Vitest test command and development dependency in `package.json` and `package-lock.json`.
- [ ] T002 Add focused Vitest configuration in `vitest.config.ts` and test helpers under `tests/unit/`.

---

## Phase 2: Foundational image-selection behavior

**Purpose**: Define and protect the ordering, capacity, and de-duplication rules used by every image editor.

- [ ] T003 [P] Create failing unit tests for ordered selection, capacity, and duplicate prevention in `tests/unit/media-selection.test.ts`.
- [ ] T004 [P] Create failing component tests for the media gallery selection contract in `tests/unit/MediaGalleryDialog.test.tsx`.
- [ ] T005 Implement pure ordered-selection and capacity helpers in `src/components/admin/media-selection.ts` until T003 passes.
- [ ] T006 Implement the accessible reusable gallery dialog in `src/components/admin/MediaGalleryDialog.tsx` until T004 passes.
- [ ] T007 Add gallery and uploader wording in `messages/en.json` and `messages/ar.json`.

**Checkpoint**: Gallery selections are testable without changing existing forms.

---

## Phase 3: User Story 1 — Coherent boutique-light storefront (Priority: P1)

**Goal**: Give both storefront and dashboard one balanced boutique-light visual language that remains accessible in Arabic and English.

**Independent Test**: Open the home page, collection, product, cart, checkout, lookbook, and dashboard in both languages; inspect focus states and mobile layout.

- [ ] T008 [US1] Replace global visual tokens and shared component states with the boutique-light palette in `src/styles/globals.css`.
- [ ] T009 [P] [US1] Refine navigation, action states, and mobile drawer styling in `src/components/storefront/Header.tsx`.
- [ ] T010 [P] [US1] Refine product-card imagery, product metadata, and wish-list action styling in `src/components/storefront/ProductCard.tsx`.
- [ ] T011 [P] [US1] Refine storefront form, cart, checkout, gallery, and search surfaces that rely on shared token roles in `src/components/storefront/`.
- [ ] T012 [P] [US1] Apply the shared dashboard surface, input, and button system to `src/components/admin/` and `src/app/[locale]/(admin)/admin/(dashboard)/`.
- [ ] T013 [US1] Verify English and Arabic focus, layout, and token consistency in a real browser using the scenarios in `quickstart.md`.

**Checkpoint**: The storefront and dashboard have a coherent identity without replacing existing content or flows.

---

## Phase 4: User Story 2 — Deliberate luxury motion (Priority: P2)

**Goal**: Add calm editorial movement that improves hierarchy without impairing browsing or reduced-motion users.

**Independent Test**: Load, scroll, hover, and use reduced motion on the home page in English and Arabic.

- [ ] T014 [US2] Add controlled reveal variants and reduced-motion-safe timing in `src/components/ui/Reveal.tsx` and `src/styles/globals.css`.
- [ ] T015 [P] [US2] Choreograph the hero entrance and signature treatment in `src/components/storefront/home/HeroSection.tsx`.
- [ ] T016 [P] [US2] Apply editorial section rhythm to `src/components/storefront/home/FeaturedProductsSection.tsx`, `NewArrivalsSection.tsx`, and `CollectionHighlightSection.tsx`.
- [ ] T017 [P] [US2] Apply image-focused motion to `src/components/storefront/home/LookbookPreviewSection.tsx`, `BrandStorySection.tsx`, and `PromoBannerSection.tsx`.
- [ ] T018 [US2] Verify normal and reduced-motion behavior in browser viewports using `quickstart.md`.

**Checkpoint**: Motion is coordinated, optional, and directionally correct.

---

## Phase 5: User Story 3 — Efficient image curation (Priority: P3)

**Goal**: Make gallery and device-file selection clear, recoverable, and accessible in every relevant dashboard form.

**Independent Test**: In a product editor, add multiple files, handle one failure, choose a gallery asset, reorder and promote the cover, save, reload, and repeat a single-image choice.

- [ ] T019 [US3] Add failing component tests for pending previews, failure retry, and order controls in `tests/unit/ImageUploader.test.tsx`.
- [ ] T020 [US3] Upgrade local previews, drag-and-drop, per-file states, retry, removable pending files, keyboard ordering, and cover actions in `src/components/admin/ImageUploader.tsx` until T019 passes.
- [ ] T021 [US3] Add gallery selection and upload feedback to the single-image control in `src/components/admin/SingleImageInput.tsx`.
- [ ] T022 [US3] Wire the shared uploader behavior through product, about, branding, collection, lookbook, and home-section forms in `src/components/admin/`.
- [ ] T023 [US3] Verify the protected media API contract remains unchanged in `src/app/api/admin/media/route.ts`, `src/lib/admin-client.ts`, and `src/lib/server/media.ts`.
- [ ] T024 [US3] Run the admin image workflow in a browser for Arabic and English using `quickstart.md`.

**Checkpoint**: Administrators can curate images using device files or existing gallery media without data loss.

---

## Phase 6: Polish, release verification, and archive

**Purpose**: Prove the implementation matches the specification and package it safely.

- [ ] T025 Re-read `specs/001-luxury-storefront/spec.md` and verify each requirement against code and runtime evidence.
- [ ] T026 Run `npm run test`, `npm run typecheck`, and `npm run build` from the repository root.
- [ ] T027 Run full desktop, mobile, Arabic, English, reduced-motion, and admin image browser verification from `specs/001-luxury-storefront/quickstart.md`.
- [ ] T028 Create and inspect a clean deployment archive in `../luxe-commerce-boutique-light-deploy.zip`.

---

## Dependencies & Execution Order

- T001–T002 must finish before test files can run.
- T003–T007 establish shared media behavior and block the image-curation story.
- T008–T013 and T014–T018 can proceed after setup; their component changes remain separate from media UI work.
- T019 must fail before T020; T020–T024 depend on T003–T007.
- T025–T028 depend on every prior implementation task.

## Parallel Opportunities

- T003 and T004 target different test files after T001–T002.
- T009–T012 target separate page/component areas after the token system is defined in T008.
- T015–T017 target independent home sections after T014.
- Browser checks must wait until the corresponding implementation group is available.

## Implementation Strategy

1. Establish tests and prove selection rules with red-green cycles.
2. Apply the visual system before altering individual storefront sections, so every route inherits coherent base colors and states.
3. Choreograph motion with the existing reveal system and test both motion preferences.
4. Upgrade image curation using shared gallery primitives and the existing protected API.
5. Verify and archive only after source checks and real-browser flows are green.
