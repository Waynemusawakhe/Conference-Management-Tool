<?php

namespace App\Modules\Registrations\Requests;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'conference_id' => [
                'sometimes',
                'integer',
                Rule::exists(Conference::class, 'id'),
            ],
            'user_id' => [
                'sometimes',
                'integer',
                Rule::exists(User::class, 'id'),
            ],
            'status' => [
                'sometimes',
                'string',
                Rule::in(['registered', 'cancelled']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'conference_id.exists' => 'The selected conference does not exist.',
            'user_id.exists' => 'The selected user does not exist.',
            'status.in' => 'Status must be either registered or cancelled.',
        ];
    }
}
