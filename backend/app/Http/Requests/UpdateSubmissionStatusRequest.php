<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubmissionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in([
                    'pending',
                    'under_review',
                    'accepted',
                    'rejected',
                    'revision_requested',
                    'withdrawn',
                ]),
            ],
        ];
    }
}