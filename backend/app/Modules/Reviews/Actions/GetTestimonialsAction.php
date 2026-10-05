<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\Testimonial;
use Illuminate\Database\Eloquent\Collection;

class GetTestimonialsAction
{
    public function execute(): Collection
    {
        return Testimonial::query()
            ->with([
                'user:id,name,role',
                'conference:id,name,code',
            ])
            ->orderByDesc('created_at')
            ->get();
    }
}