<?php

return [
    // Enable only after the pg_trgm extension migration has run on PostgreSQL.
    'typo_search_enabled' => env('CONFERENCE_TYPO_SEARCH_ENABLED', false),
];
