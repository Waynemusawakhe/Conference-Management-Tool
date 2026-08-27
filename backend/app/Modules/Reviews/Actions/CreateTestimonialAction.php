<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\Testimonial;

class CreateTestimonialAction
{
    public function execute(array $data): Testimonial
    {
        return Testimonial::create([
            'user_id' => $data['user_id'],
            'conference_id' => $data['conference_id'],
            'rating' => $data['rating'],
            'content' => $data['content'],
        ]);
    }
}