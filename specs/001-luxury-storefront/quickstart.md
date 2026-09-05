# Validation Guide: Luxury Storefront Refresh

## Prerequisites

- Node.js 20 or newer.
- A fresh local environment file created from `.env.example` with the required administrator configuration.
- A local administrator session for dashboard checks and at least a few reusable media assets for gallery selection.

## Install and run

```powershell
npm ci
npm run dev
```

Open the English storefront, Arabic storefront, and authenticated dashboard in a modern browser.

## Storefront checks

1. Visit the home, collection, product, cart, checkout, lookbook, and about pages in each language.
2. Check that light surfaces, charcoal hierarchy, stone metadata, and restrained bronze actions remain consistent.
3. Navigate keyboard-only through header, actions, product cards, and purchase controls; focus must be visible.
4. Resize to a narrow mobile viewport; no control must be clipped or create horizontal scroll.
5. Enable the browser’s reduced-motion emulation and reload the home page; all content must remain immediately usable without non-essential movement.

## Image curation checks

1. Open a product or about editor and add several permitted images by click and drag-and-drop.
2. Confirm previews and per-file states appear; force one invalid selection and confirm successful selections remain.
3. Open the gallery, select reusable unselected images, and verify selected and capacity states update.
4. Change the cover, reorder using drag and the move buttons, remove an item, and save.
5. Repeat in a single-image field such as collection, branding, lookbook, or homepage image.

## Automated checks

```powershell
npm test
npm run typecheck
npm run build
```

All commands must exit successfully before the deployment ZIP is created. Use the browser checks above to validate the contracts in [media-gallery.md](./contracts/media-gallery.md).
