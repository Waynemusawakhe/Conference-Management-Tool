<?php

namespace App\Modules\Conferences\Controllers;

use App\Modules\Conferences\Models\Conference;
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
            ->where('name', 'ilike', '%'.addcslashes($term, '%_\\').'%')
            ->orderBy('name')
            ->limit(5)
            ->get();

        return response()->json(['data' => $conferences]);
    }
}
