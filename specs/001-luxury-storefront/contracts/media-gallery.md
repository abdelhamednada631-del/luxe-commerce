# Media Gallery Client Contract

## Purpose

Define the client-facing behavior that the new gallery and upgraded upload controls depend on. Existing server routes remain backward compatible.

## List reusable assets

**Request**: authenticated `GET /api/admin/media`

**Success response**:

```json
{
  "media": [
    {
      "id": 42,
      "filename": "server-owned-name.webp",
      "mime": "image/webp",
      "width": 1200,
      "height": 1600,
      "size_bytes": 184322,
      "usedCount": 2
    }
  ]
}
```

**Client requirements**:

- Fetch only when the gallery dialog is opened.
- Treat IDs as unique positive integers.
- Visually mark IDs already selected by the active form and do not add them again.
- Show a safe loading, empty, and retry state; never expose storage paths.

## Upload an asset

**Request**: authenticated `POST /api/admin/media` with one `file` form field.

**Success response**:

```json
{
  "ok": true,
  "media": {
    "id": 42,
    "filename": "server-owned-name.webp",
    "mime": "image/webp",
    "width": 1200,
    "height": 1600,
    "size_bytes": 184322
  }
}
```

**Failure behavior**:

- `413` means the input exceeds the permitted size.
- `415` means the input is invalid or unsupported.
- `429` means the administrator must wait before retrying.
- Other network or server failures remain attached to the affected pending file so other uploads and selections stay available.

## Selection behavior

- Multiple-image forms preserve ordered, unique IDs and identify index zero as cover.
- Single-image forms replace the current ID only after a new upload or gallery selection succeeds.
- Capacity is checked before accepting device files and before applying gallery selections.
- Controls expose equivalent localized labels in both interface languages.
