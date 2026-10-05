<?php

namespace App\Modules\Registrations\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'prohibited',
            ],

            'conference_id' => [
                'prohibited',
            ],

            'status' => [
                'required',
                'string',
                Rule::in([
                    'registered',
                    'cancelled',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.prohibited' =>
                'The registration owner cannot be changed.',

            'conference_id.prohibited' =>
                'The registration conference cannot be changed.',

            'status.required' =>
                'A registration status is required.',

            'status.in' =>
                'Status must be either registered or cancelled.',
        ];
    }
}