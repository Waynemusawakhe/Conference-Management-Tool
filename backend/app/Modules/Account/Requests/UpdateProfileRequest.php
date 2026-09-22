<?php

namespace App\Modules\Account\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'required_without:email',
                'string',
                'min:2',
                'max:255',
            ],

            'email' => [
                'sometimes',
                'required_without:name',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($this->user()->id),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => trim((string) $this->input('name')),
            ]);
        }

        if ($this->has('email')) {
            $this->merge([
                'email' => strtolower(
                    trim((string) $this->input('email'))
                ),
            ]);
        }
    }
}