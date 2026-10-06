<?php

namespace App\Modules\Account\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
use Illuminate\Validation\Rule;

class AssignRoleRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        // The route middleware will enforce that only an Admin can reach this
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'role' => [
                'required',
                'string',
                Rule::in(['admin', 'organiser', 'reviewer', 'author', 'attendee']),
            ],
        ];
    }
}
