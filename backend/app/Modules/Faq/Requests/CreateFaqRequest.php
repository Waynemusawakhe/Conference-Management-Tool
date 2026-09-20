<?php

namespace App\Modules\Faq\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
use Illuminate\Support\Facades\Auth;

class CreateFaqRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'max:500'],
            'answer' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'question.required' => 'The FAQ question is required.',
            'answer.required' => 'The FAQ answer is required.',
        ];
    }
}