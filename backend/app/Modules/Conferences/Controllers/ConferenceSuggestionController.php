<?php

namespace App\Modules\Conferences\Controllers;

use App\Modules\Conferences\Models\Conference;
use App\Modules\Conferences\Support\ConferenceTypoSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConferenceSuggestionController
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $term = trim($validated['q']);

        if (mb_strlen($term) < 2) {
            return response()->json(['data' => []]);
        }

        $conferences = Conference::query()
            ->select(['id', 'name', 'category', 'city', 'country'])
            ->where(function ($query) use ($term): void {
                $query->where('name', 'ilike', '%'.addcslashes($term, '%_\\\\').'%');
                ConferenceTypoSearch::apply($query, $term);
            })
            ->when(ConferenceTypoSearch::enabled() && mb_strlen($term) >= 3, function ($query) use ($term) {
                $query->orderByRaw('CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END', [mb_strtolower($term).'%'])
                    ->orderByRaw('similarity(name, ?) DESC', [$term]);
            })
            ->orderBy('name')
            ->limit(5)
            ->get();

        return response()->json(['data' => $conferences]);
    }
}
