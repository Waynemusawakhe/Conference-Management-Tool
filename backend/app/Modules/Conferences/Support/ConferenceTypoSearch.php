<?php

namespace App\Modules\Conferences\Support;

use App\Modules\Conferences\Models\Conference;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ConferenceTypoSearch
{
    public static function enabled(): bool
    {
        return DB::connection()->getDriverName() === 'pgsql'
            && (bool) config('conferences.typo_search_enabled', false);
    }

    public static function apply(Builder $query, string $term): Builder
    {
        if (! self::enabled() || mb_strlen($term) < 3) {
            return $query;
        }

        return $query->orWhereRaw('word_similarity(?, name) >= ?', [$term, 0.3]);
    }

    public static function suggestedTitle(string $term): ?string
    {
        if (! self::enabled() || mb_strlen($term) < 3) {
            return null;
        }

        $match = Conference::query()
            ->select('name')
            ->selectRaw('word_similarity(?, name) AS match_score', [$term])
            ->whereRaw('word_similarity(?, name) >= ?', [$term, 0.3])
            ->orderByDesc('match_score')
            ->orderBy('name')
            ->first();

        return $match && mb_strtolower($match->name) !== mb_strtolower($term)
            ? $match->name
            : null;
    }
}
