<?php

namespace App\Modules\Reporting\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class RegistrationStatisticsRequest extends FormRequest
{
    /**
     * The reporting endpoint is protected by authentication
     * and authorisation middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Return validation errors using the project's
     * standard JSON response structure.
     */
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

    /**
     * Validate registration statistics filters.
     */
    public function rules(): array
    {
        return [
            /*
             * Optional conference filter.
             *
             * The conference must actually exist in the
             * conferences table.
             */
            'conference_id' => [
                'nullable',
                'integer',
                'exists:conferences,id',
            ],

            /*
             * Registration statuses are defined by the
             * conference_registrations database constraint:
             *
             * registered | cancelled
             */
            'status' => [
                'nullable',
                'string',
                Rule::in([
                    'registered',
                    'cancelled',
                ]),
            ],

            /*
             * Only consider registrations created on or
             * after this date.
             */
            'date_from' => [
                'nullable',
                'date',
            ],

            /*
             * Only consider registrations created on or
             * before this date.
             *
             * after_or_equal prevents an invalid date range.
             */
            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],
        ];
    }
}