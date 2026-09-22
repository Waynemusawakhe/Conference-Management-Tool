<?php

namespace App\Modules\ContactMessages\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
use Illuminate\Validation\Rule;

class UpdateContactMessageStatusRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['new', 'in_progress', 'resolved'])],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'A status is required.',
            'status.in' => 'Status must be one of: new, in_progress, resolved.',
        ];
    }
}