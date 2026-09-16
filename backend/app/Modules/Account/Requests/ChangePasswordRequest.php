<?php

namespace App\Modules\Account\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;

class ChangePasswordRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => [
                'required',
                'string',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'different:current_password',
            ],
        ];
    }
}