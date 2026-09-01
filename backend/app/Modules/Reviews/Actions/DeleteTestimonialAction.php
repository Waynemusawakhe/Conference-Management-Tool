<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\Testimonial;

class DeleteTestimonialAction
{
    public function execute(Testimonial $testimonial): void
    {
        $testimonial->delete();
    }
}
