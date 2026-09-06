<?php

namespace App\Modules\Sessions\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $table = 'conference_sessions';

    protected $fillable = [
        'title',
        'description',
        'start_time',
        'end_time',
        'location',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];
}
