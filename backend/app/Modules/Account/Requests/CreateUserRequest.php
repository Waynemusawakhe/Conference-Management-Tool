<?php

namespace App\Modules\Account\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
use Illuminate\Validation\Rule;

class CreateUserRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'role' => [
                'required',
                'string',
                Rule::in([
                    'author',
                    'reviewer',
                    'organiser',
                    'attendee',
                ]),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim(
                (string) $this->input('name')
            ),

            'email' => strtolower(
                trim((string) $this->input('email'))
            ),

            'role' => strtolower(
                trim((string) $this->input('role'))
            ),
        ]);
    }

    public function messages(): array
    {
        return [
            'role.in' => 'Public registration is only available for Author, Reviewer, Organiser, or Attendee accounts.',
        ];
    }
}