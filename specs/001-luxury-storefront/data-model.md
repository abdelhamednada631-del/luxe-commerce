# Data Model: Luxury Storefront Refresh

## Existing persisted entity: Media asset

| Field | Meaning | Validation / use |
|---|---|---|
| `id` | Stable reusable asset identifier | Positive integer, selected by dashboard forms |
| `filename` | Processed stored-image name | Server-owned; never supplied by client selection |
| `mime` | Delivered image type | Server-generated |
| `width`, `height` | Processed dimensions | Used to describe gallery images |
| `size_bytes` | Processed file size | Presented as optional metadata only |
| `usedCount` | Number of active references | Read-only gallery context |

No persisted field changes are required.

## Client-only entity: Pending upload

| Field | Meaning |
|---|---|
| `key` | Stable local key for rendering and retry/removal |
| `file` | Original browser file object |
| `previewUrl` | Local object URL, revoked when no longer needed |
| `name` | File name shown to the administrator |
| `status` | `queued`, `uploading`, `failed`, or `complete` |
| `errorCode` | Optional localized failure reason |
| `mediaId` | Resulting asset ID when complete |

## Client-only entity: Image selection

| Field | Meaning | Rules |
|---|---|---|
| `mediaIds` | Ordered asset IDs for a form | Positive, unique IDs; first item is the cover |
| `max` | Form-specific capacity | Existing form limit; never exceeded |
| `remaining` | Available positions | `max - mediaIds.length - acceptedPendingCount` |

### State transitions

```text
device file → queued → uploading → complete (add resulting unique media ID)
                            └────→ failed (can retry or remove)
gallery asset → selected (if capacity remains and ID is not selected)
selected image → move earlier/later or drag position → ordered selection
selected image → remove → no longer selected
```

## Visual tokens

Tokens are configuration roles, not persisted customer data. The admin-configured accent remains an override for the approved bronze default and is used only where the contrast contract is preserved.
