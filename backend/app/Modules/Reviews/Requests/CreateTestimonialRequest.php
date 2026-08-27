<?php

namespace App\Modules\Reviews\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;

class CreateTestimonialRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'conference_id' => ['required', 'integer', 'exists:conferences,id'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'content' => ['required', 'string'],
        ];
    }
}