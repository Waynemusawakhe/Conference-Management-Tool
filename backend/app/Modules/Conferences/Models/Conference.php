<?php

namespace App\Modules\Conferences\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Conference extends Model
{
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
}