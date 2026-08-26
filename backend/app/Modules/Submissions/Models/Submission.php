<?php

namespace App\Modules\Submissions\Models;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Database\Factories\SubmissionFactory;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'conference_id',
        'author_id',
        'final_decision_by',
        'title',
        'track',
        'abstract',
        'file_path',
        'file_size_bytes',
        'status',
        'final_decision_at',
    ];

    protected function casts(): array
    {
        return [
            'final_decision_at' => 'datetime',
            'file_size_bytes' => 'integer',
        ];
    }

    public function conference(): BelongsTo
    {
        return $this->belongsTo(Conference::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Distinct from the author — who made the final accept/reject call.
     * Null until a decision is recorded.
     */
    public function decisionMaker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'final_decision_by');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(SubmissionReview::class);
    }

    /**
     * Flipped relationship: the session holds the FK to the submission,
     * not the other way around — a submission occupies at most one slot.
     */
    public function session(): HasOne
    {
        return $this->hasOne(ConferenceSession::class);
    }

    public function recordDecision(User $decisionMaker, string $status): void
    {
        $this->update([
            'status' => $status,
            'final_decision_by' => $decisionMaker->id,
            'final_decision_at' => now(),
        ]);
    }

    protected static function newFactory(): SubmissionFactory
    {
        return SubmissionFactory::new();
    }
}
