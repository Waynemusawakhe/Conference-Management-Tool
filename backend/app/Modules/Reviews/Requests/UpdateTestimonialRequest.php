<?php

namespace App\Modules\Reviews\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;

class UpdateTestimonialRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'between:1,5'],
            'content' => ['required', 'string'],
        ];
    }
}