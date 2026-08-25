<?php

namespace App\Modules\Submissions\Models;

use App\Modules\Conferences\Models\Conference;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConferenceSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'conference_id',
        'submission_id',
        'title',
        'track',
        'room',
        'scheduled_time',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_time' => 'datetime',
        ];
    }

    public function conference(): BelongsTo
    {
        return $this->belongsTo(Conference::class);
    }

    /**
     * This table holds the FK — a session may or may not have a submission
     * scheduled into it yet.
     */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }
}
