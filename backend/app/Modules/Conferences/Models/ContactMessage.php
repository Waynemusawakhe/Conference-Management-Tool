<?php

namespace App\Modules\Conferences\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'message',
        'status',
    ];

    /**
     * user_id is nullable — a visitor can submit this without an account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
