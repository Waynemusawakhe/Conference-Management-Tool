<?php

namespace App\Modules\Conferences\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateConferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:50',
                'unique:conferences,code',
            ],

            'name' => [
                'required',
                'string',
                'min:3',
                'max:255',
            ],

            'description' => [
                'required',
                'string',
                'min:10',
                'max:5000',
            ],

            'category' => [
                'required',
                'string',
                'max:100',
            ],

            'topics' => [
                'required',
                'array',
                'min:1',
            ],

            'topics.*' => [
                'required',
                'string',
                'max:100',
            ],

            'format' => [
                'required',
                'string',
                'in:virtual,in-person,hybrid',
            ],

            'submission_status' => [
                'required',
                'string',
                'in:open,closed',
            ],

            'start_date' => [
                'required',
                'date',
                'after_or_equal:today',
            ],

            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],

            'submission_deadline' => [
                'required',
                'date',
                'before_or_equal:start_date',
            ],

            'venue_name' => [
                'required_if:format,in-person,hybrid',
                'nullable',
                'string',
                'max:255',
            ],

            'city' => [
                'required',
                'string',
                'max:100',
            ],

            'country' => [
                'required',
                'string',
                'max:100',
            ],

            'website_link' => [
                'nullable',
                'url',
                'max:2048',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'code.unique' =>
                'A conference with this code already exists.',

            'end_date.after_or_equal' =>
                'The conference end date must be on or after the start date.',

            'submission_deadline.before_or_equal' =>
                'The submission deadline must be on or before the conference start date.',

            'venue_name.required_if' =>
                'A venue name is required for in-person or hybrid conferences.',

            'website_link.url' =>
                'The website link must be a valid URL.',
        ];
    }
}