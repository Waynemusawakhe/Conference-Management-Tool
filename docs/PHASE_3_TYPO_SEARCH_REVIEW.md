# Phase 3 — Typo-tolerant conference search (review)

## Status
Code proposed for review only. No AWS deployment, migration execution, or production configuration change has been performed.

Phase 1 autocomplete is merged but remains `feature1_not_fixed` until the AWS suggestions API HTTP 500 is diagnosed separately.

## Behavior
- Existing exact/substring search remains unchanged by default.
- With `CONFERENCE_TYPO_SEARCH_ENABLED=true` on PostgreSQL, title suggestions and the main conference listing also match similar misspelled title fragments using pg_trgm word_similarity.
- Existing search filters and pagination remain in place.
- The suggestions API keeps its existing JSON `data` structure; matching typo titles appear as normal suggestions.
- Non-PostgreSQL databases keep existing behavior.

## AWS deployment checklist (team-owned)
1. Identify the actual Laravel backend deployment and verify the running commit and database credentials; investigate Phase 1 HTTP 500 separately.
2. Back up the production database and confirm PostgreSQL supports the trusted `pg_trgm` extension. Confirm the migration account has CREATE privileges. Do not blindly run migrations.
3. Run backend CI and PostgreSQL integration tests in staging, including `ConferenceTypoSearchTest`, `ConferenceSuggestionsTest`, and `ConferenceBrowseApiTest`.
4. Apply the migration in staging, then enable `CONFERENCE_TYPO_SEARCH_ENABLED=true` in staging and clear Laravel config cache.
5. Test `GET /api/v1/conferences/suggestions?q=Artifical` and `GET /api/v1/conferences?search=Artifical`; check ordinary searches and filters.
6. Review query plans/performance for the dataset size, then schedule production rollout separately. The default flag is false.
7. To roll back behavior quickly, set `CONFERENCE_TYPO_SEARCH_ENABLED=false` and clear config cache; the migration index can remain.

## Limitations
- Requires PostgreSQL and pg_trgm when enabled.
- Does not provide a dedicated "Did you mean?" UI banner; the existing suggestion dropdown displays corrected title matches.
- AWS tests, frontend end-to-end testing, and production behavior are not verified by this PR.
