# Admin Media Gallery Contract

## Purpose

Describe the client contract for the existing authenticated media routes. No server contract changes are required.

## List reusable media

`GET /api/admin/media`

### Successful response

```json
{
  "media": [
    {
      "id": 42,
      "filename": "processed.webp",
      "mime": "image/webp",
      "width": 1200,
      "height": 1600,
      "size_bytes": 176340,
      "usedCount": 2
    }
  ]
}
```

### Client rules

- Request only after the administrator opens the gallery.
- Render a loading, empty, and failed state.
- Prevent selection of IDs already in the parent form.
- Do not add more items than the remaining capacity.
- Fetch failures must not clear the form’s existing selection.

## Upload a new image

`POST /api/admin/media` with one `file` multipart field.

### Successful response

```json
{
  "ok": true,
  "media": { "id": 42 }
}
```

### Relevant failure responses

| Status | Error | Client behavior |
|--------|-------|-----------------|
| 400 | no_file or invalid_form | Show a non-technical failure for the affected item |
| 413 | too_large | Mark only that item failed with the size guidance |
| 415 | invalid_type or decode_failed | Mark only that item failed with the format guidance |
| 429 | rate_limited | Preserve the item and offer retry after the indicated period |
| 401 or 403 | authorization failure | Show the existing safe error and do not expose media details |

## Ordering interface

The parent receives one ordered `number[]`. It persists the order unchanged through the existing product and about-form save routes. Index zero is the cover image.
