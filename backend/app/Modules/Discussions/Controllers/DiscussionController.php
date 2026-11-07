<?php

namespace App\Modules\Discussions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Discussions\Models\Discussion;
use App\Modules\Discussions\Models\DiscussionComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscussionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['nullable', 'string', 'max:60'],
            'conference_id' => ['nullable', 'integer', 'exists:conferences,id'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $discussions = Discussion::query()
            ->where('is_hidden', false)
            ->with([
                'user:id,name',
                'conference:id,name,code',
            ])
            ->withCount([
                'comments' => fn ($query) => $query->where('is_hidden', false),
            ])
            ->when($validated['category'] ?? null, fn ($query, $category) => $query->where('category', $category))
            ->when($validated['conference_id'] ?? null, fn ($query, $conferenceId) => $query->where('conference_id', $conferenceId))
            ->when($validated['search'] ?? null, function ($query, $search): void {
                $query->where(function ($nested) use ($search): void {
                    $term = '%'.mb_strtolower($search).'%';

                    $nested->whereRaw('LOWER(title) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(body) LIKE ?', [$term]);
                });
            })
            ->orderByDesc('is_pinned')
            ->latest()
            ->paginate($validated['per_page'] ?? 15);

        return response()->json($discussions);
    }

    public function show(Discussion $discussion): JsonResponse
    {
        abort_if($discussion->is_hidden, 404);

        $discussion->load([
            'user:id,name',
            'conference:id,name,code',
            'comments' => fn ($query) => $query->where('is_hidden', false)->oldest(),
            'comments.user:id,name',
        ])->loadCount([
            'comments' => fn ($query) => $query->where('is_hidden', false),
        ]);

        return response()->json(['data' => $discussion]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'min:4', 'max:180'],
            'body' => ['required', 'string', 'min:10', 'max:5000'],
            'category' => ['required', 'string', 'max:60'],
            'conference_id' => ['nullable', 'integer', 'exists:conferences,id'],
        ]);

        $discussion = Discussion::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        $discussion->load(['user:id,name', 'conference:id,name,code']);

        return response()->json(['data' => $discussion], 201);
    }

    public function storeComment(Request $request, Discussion $discussion): JsonResponse
    {
        abort_if($discussion->is_hidden, 404);

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:2', 'max:2000'],
        ]);

        $comment = $discussion->comments()->create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        $comment->load('user:id,name');

        return response()->json(['data' => $comment], 201);
    }

    public function destroy(Request $request, Discussion $discussion): JsonResponse
    {
        abort_unless($this->canManage($request, $discussion->user_id), 403);
        $discussion->delete();

        return response()->json(['success' => true]);
    }

    public function destroyComment(Request $request, Discussion $discussion, DiscussionComment $comment): JsonResponse
    {
        abort_unless($comment->discussion_id === $discussion->id, 404);
        abort_unless($this->canManage($request, $comment->user_id), 403);
        $comment->delete();

        return response()->json(['success' => true]);
    }

    public function updateVisibility(Request $request, Discussion $discussion): JsonResponse
    {
        abort_unless($request->user()->role === 'admin', 403);

        $validated = $request->validate([
            'is_hidden' => ['required', 'boolean'],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);

        $discussion->update($validated);

        return response()->json(['data' => $discussion->fresh()]);
    }

    private function canManage(Request $request, int $ownerId): bool
    {
        return $request->user()->id === $ownerId || $request->user()->role === 'admin';
    }
}
