<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\Testimonial;
<<<<<<< HEAD
=======
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
>>>>>>> origin/main

class CreateTestimonialAction
{
    public function execute(array $data): Testimonial
    {
<<<<<<< HEAD
        return Testimonial::create([
            'user_id' => $data['user_id'],
            'conference_id' => $data['conference_id'],
            'rating' => $data['rating'],
            'content' => $data['content'],
        ]);
    }
}
=======
        try {
            return Testimonial::create([
                'user_id' => $data['user_id'],
                'conference_id' => $data['conference_id'],
                'rating' => $data['rating'],
                'content' => $data['content'],
            ]);
        } catch (QueryException $exception) {
            if (
                $exception->getCode() === '23505'
                || str_contains(
                    $exception->getMessage(),
                    'UNIQUE constraint failed'
                )
                || str_contains(
                    $exception->getMessage(),
                    'Duplicate entry'
                )
            ) {
                throw ValidationException::withMessages([
                    'conference_id' =>
                        'You have already submitted a testimonial for this conference.',
                ]);
            }

            throw $exception;
        }
    }
}
>>>>>>> origin/main
