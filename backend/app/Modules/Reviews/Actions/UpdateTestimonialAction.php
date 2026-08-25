<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\Testimonial;

class UpdateTestimonialAction
{
    public function execute(Testimonial $testimonial, array $data): Testimonial
    {
        $testimonial->update([
            'rating' => $data['rating'],
            'content' => $data['content'],
        ]);

        return $testimonial->refresh();
    }
}