# Frontend post-merge fixes

This branch addresses the frontend section of the 6 October 2026 issue register against current `main`. Backend application files are unchanged.

| Register items | Resolution |
| --- | --- |
| 1–2: organiser sessions | Current main already sends and displays `scheduled_time`. Removed the duplicate date input and labelled the single scheduled-time control. |
| 3: registration parameters | Already forwarded on main; covered by adapter regression tests. Cancelled registrations no longer appear registered in the catalogue. |
| 4: My Conferences | Uses existing role-specific workspace chrome; combines and deduplicates attendance, author submissions, owned conferences, and reviewer assignments. Follows API pagination and resolves reviewer conference details. |
| 5–7: catalogue filters/search | Uses API status (`open`, `closed`) and format (`in_person`, `hybrid`, `virtual`) values, human-readable display labels, and server search/filter/sort on every page. Resets pagination for changed queries and ignores stale responses. Country is a text field so choices are not limited to the loaded page. |
| 8–9: proposal uploads/workflow | Accepts PDF, DOC and DOCX with the existing 10 MB limit; removed attendee-only branches. |
| 10–11: proposal/edit permissions | Conference-card submission action is author-only. Edit-content route permits authors and admins, matching current policy. |
| 12: testimonials | Current backend now permits admin moderation; existing admin delete action is compatible and retained. |
| 13: homepage mocks | Featured conferences use the live API, with loading, error/retry and empty states. Searches navigate to the paginated catalogue. |
| 14–16: authentication | Login returns to a safe internal requested route, preserving query/hash. Removed login debug output and repaired registration UTF-8 text. |
| 17: deletion Cancel | Enabled without a password; disabled only during the deletion request. |
| 18–19: reviews | Current backend explicitly accepts 1–5 and supports editing until explicit lock. Preserved matching UI, removed provisional wording and added lifecycle regression tests. |
| 20: admin navigation | Recent-submission clicks navigate to submission management. |
| 21: contact parameters | Already forwarded on main; covered by tests. Added inbox pagination using API metadata and server status filters. Free-text inbox search is explicitly scoped to the current page because the API has no search parameter. |
| 22: validation pipeline | ESLint plus Vitest/Testing Library tests run before the frontend build in CI. Lint catches undefined variables and invalid hook calls; fixed a pre-existing undefined dashboard target in the alternate conference form. |
| 23: bundle | Lazy-loaded page routes. Initial production JavaScript is approximately 203 kB before gzip, below Vite's 500 kB warning threshold. |
| 24: comments | Removed temporary NEW/CHANGED annotations and provisional score notes. |

## Checks

From `frontend`, run `npm ci`, `npm run lint`, `npm test` and `npm run build`.
Tests exercise adapters, guards, internal login redirects, role-sensitive proposal actions, server catalogue filters, pagination, My Conferences relationships, upload selection, editable/locked reviews and account deletion cancellation. Component tests mock API responses; live deployment and signed-in browser flows still need team acceptance testing.

## Existing API limits

The registrations endpoint restricts organisers to registrations for conferences they own. The frontend cannot reveal an organiser's attendance at another organiser's conference through that endpoint. A complete cross-role attendance view requires a backend personal-registration endpoint or an ownership-filter change. This branch keeps the backend scope unchanged.

My Conferences follows all relevant pages to aggregate relationships; large installations would benefit from a dedicated paginated personal-conferences API. The public catalogue remains server-paginated.
