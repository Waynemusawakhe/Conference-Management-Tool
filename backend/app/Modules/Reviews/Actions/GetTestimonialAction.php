<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\Testimonial;

class GetTestimonialAction
{
    public function execute(
        int $id
    ): Testimonial {
        return Testimonial::query()
            ->with([
                'user:id,name,role',
                'conference:id,name,code',
            ])
            ->findOrFail($id);
    }
}
