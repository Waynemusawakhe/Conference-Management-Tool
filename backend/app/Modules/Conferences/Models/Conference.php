<?php

namespace App\Modules\Conferences\Models;

use App\Models\User;
use App\Modules\Submissions\Models\ConferenceSession;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conference extends Model
{
    use HasFactory;

    protected $fillable = [
        'organiser_id',
        'code',
        'name',
        'description',
        'category',
        'topics',
        'format',
        'submission_status',
        'start_date',
        'end_date',
        'submission_deadline',
        'venue_name',
        'city',
        'country',
        'website_link',
    ];

    protected function casts(): array
    {
        return [
            'topics' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'submission_deadline' => 'date',
        ];
    }

    public function organiser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organiser_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ConferenceSession::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(ConferenceRegistration::class);
    }

    public function attendees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conference_registrations')
            ->withPivot(['status', 'registered_at', 'cancelled_at'])
            ->withTimestamps();
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(Testimonial::class);
    }
}
