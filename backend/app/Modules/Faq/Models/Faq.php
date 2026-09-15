<?php

namespace App\Modules\Faq\Models;

use Database\Factories\FaqFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'answer',
        'category',
    ];

    protected static function newFactory(): FaqFactory
    {
        return FaqFactory::new();
    }
}