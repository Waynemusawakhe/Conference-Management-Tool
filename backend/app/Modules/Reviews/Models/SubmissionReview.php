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
     * Submit or update an unlocked review.
     *
     * Submission and locking are separate lifecycle steps:
     *
     * assigned -> submitted/editable -> locked
     *
     * The dedicated lock endpoint is responsible for permanently
     * preventing further reviewer edits.
     */
    public function submit(
        int $score,
        string $comments,
        string $recommendation
    ): void {
        $this->update([
            'score' => $score,
            'comments' => $comments,
            'recommendation' => $recommendation,
            'submitted_at' => now(),
            'locked' => false,
        ]);
    }
}
