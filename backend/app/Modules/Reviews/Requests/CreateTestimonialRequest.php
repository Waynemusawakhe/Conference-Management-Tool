<?php

namespace App\Modules\Reviews\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
<<<<<<< HEAD
=======
use Illuminate\Validation\Rule;
>>>>>>> origin/main

class CreateTestimonialRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
<<<<<<< HEAD
        return true;
=======
        return $this->user() !== null;
>>>>>>> origin/main
    }

    public function rules(): array
    {
        return [
<<<<<<< HEAD
            'conference_id' => ['required', 'integer', 'exists:conferences,id'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'content' => ['required', 'string'],
        ];
    }
}
=======
            'conference_id' => [
                'required',
                'integer',
                'exists:conferences,id',
                Rule::unique(
                    'testimonials',
                    'conference_id'
                )->where(
                    'user_id',
                    $this->user()?->id
                ),
            ],
            'rating' => [
                'required',
                'integer',
                'between:1,5',
            ],
            'content' => [
                'required',
                'string',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'conference_id.required' =>
                'Conference ID is required.',

            'conference_id.exists' =>
                'The selected conference does not exist.',

            'conference_id.unique' =>
                'You have already submitted a testimonial for this conference.',

            'rating.required' =>
                'A rating is required.',

            'rating.between' =>
                'The rating must be between 1 and 5.',

            'content.required' =>
                'Testimonial content is required.',
        ];
    }
}
>>>>>>> origin/main
