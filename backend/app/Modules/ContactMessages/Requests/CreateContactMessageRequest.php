<?php

namespace App\Modules\ContactMessages\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;

class CreateContactMessageRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Your name is required.',
            'email.required' => 'Your email is required.',
            'email.email' => 'Please enter a valid email address.',
            'message.required' => 'A message is required.',
        ];
    }
}