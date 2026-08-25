<?php

namespace App\Modules\Reviews\Models;

use App\Models\User;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubmissionReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'reviewer_id',
        'score',
        'comments',
        'recommendation',
        'locked',
        'assigned_at',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'locked' => 'boolean',
            'assigned_at' => 'datetime',
            'submitted_at' => 'datetime',
            'score' => 'integer',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Submits and locks the review in one step. The DB trigger
     * (submission_reviews_lock_guard) rejects any further UPDATE once
     * locked is true, so this should be the last write to a review.
     */
    public function submit(int $score, string $comments, string $recommendation): void
    {
        $this->update([
            'score' => $score,
            'comments' => $comments,
            'recommendation' => $recommendation,
            'submitted_at' => now(),
            'locked' => true,
        ]);
    }
}
