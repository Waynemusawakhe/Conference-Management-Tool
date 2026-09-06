<?php

namespace App\Modules\Reviews\Models;

use Illuminate\Database\Eloquent\Model;

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
}
