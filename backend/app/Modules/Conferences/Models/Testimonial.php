<?php

namespace App\Modules\Reviews\Models;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimonial extends Model
{
    protected $fillable = [
        'user_id',
        'conference_id',
        'rating',
        'content',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    public function conference(): BelongsTo
    {
        return $this->belongsTo(
            Conference::class,
            'conference_id'
        );
    }
}