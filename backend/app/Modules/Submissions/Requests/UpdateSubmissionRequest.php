<?php

namespace App\Modules\Submissions\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'track' => ['sometimes', 'nullable', 'string', 'max:255'],
            'abstract' => ['sometimes', 'required', 'string', 'max:5000'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }
}
