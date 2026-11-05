<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'title',
        'message',
        'action_url',
        'target_type',
        'target_value',
        'channels',
        'recipient_count',
        'sent_by',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'channels' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(NotificationTemplate::class, 'template_id');
    }
}
