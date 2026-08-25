<?php

namespace App\Modules\Registrations\Requests;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CreateRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'conference_id' => [
                'required',
                'integer',
                Rule::exists(Conference::class, 'id'),
            ],
            'user_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id'),
            ],
            'status' => [
                'nullable',
                'string',
                Rule::in(['registered', 'cancelled']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'conference_id.required' => 'Conference ID is required.',
            'conference_id.exists' => 'The selected conference does not exist.',
            'user_id.required' => 'User ID is required.',
            'user_id.exists' => 'The selected user does not exist.',
            'status.in' => 'Status must be either registered or cancelled.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (Auth::check() && !$this->has('user_id')) {
            $this->merge([
                'user_id' => Auth::id(),
            ]);
        }
    }
}
