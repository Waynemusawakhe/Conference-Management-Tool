<?php

namespace App\Modules\Submissions\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'track' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'abstract' => [
                'sometimes',
                'required',
                'string',
                'max:5000',
            ],

            'file' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.file' => 'The submission document must be a valid file.',

            'file.mimes' => 'The submission document must be a PDF, DOC, or DOCX file.',

            'file.max' => 'The submission document may not be larger than 10 MB.',
        ];
    }
}
