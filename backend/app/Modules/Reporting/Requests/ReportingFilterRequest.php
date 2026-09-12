<?php

namespace App\Modules\Reporting\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ReportingFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422)
        );
    }

    public function rules(): array
    {
        return [
            'conference_id' => [
                'nullable',
                'integer',
                'exists:conferences,id',
            ],

            'status' => [
                'nullable',
                'string',
                Rule::in([
                    'pending',
                    'under_review',
                    'accepted',
                    'rejected',
                    'revision_requested',
                ]),
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],
        ];
    }
}