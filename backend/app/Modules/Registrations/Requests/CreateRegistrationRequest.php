<?php

namespace App\Modules\Registrations\Requests;

use App\Modules\Conferences\Models\Conference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'conference_id' => [
                'required',
                'integer',
                Rule::exists(Conference::class, 'id'),
                Rule::unique(
                    'conference_registrations',
                    'conference_id'
                )->where(
                    'user_id',
                    $this->user()?->id
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'conference_id.required' =>
                'Conference ID is required.',

            'conference_id.exists' =>
                'The selected conference does not exist.',

            'conference_id.unique' =>
                'You are already registered for this conference.',
        ];
    }
}