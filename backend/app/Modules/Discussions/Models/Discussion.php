<?php

namespace App\Modules\Discussions\Models;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discussion extends Model
{
    protected $fillable = [
        'user_id',
        'conference_id',
        'title',
        'body',
        'category',
        'is_pinned',
        'is_hidden',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'is_hidden' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conference(): BelongsTo
    {
        return $this->belongsTo(Conference::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(DiscussionComment::class);
    }
}
