<?php

namespace App\Modules\Reviews\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class SubmitReviewRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            // Assumption: 1-10 rating scale. Adjust to match whatever range
            // the team/frontend actually agreed on for `score`.
            'score' => ['required', 'integer', 'min:1', 'max:10'],
            'comments' => ['required', 'string', 'min:3'],
            'recommendation' => ['required', 'string', Rule::in(['accept', 'reject', 'revise'])],
        ];
    }

    public function messages(): array
    {
        return [
            'score.required' => 'A score is required.',
            'score.min' => 'Score must be at least 1.',
            'score.max' => 'Score must not be greater than 10.',
            'comments.required' => 'Comments are required.',
            'recommendation.required' => 'A recommendation is required.',
            'recommendation.in' => 'Recommendation must be accept, reject, or revise.',
        ];
    }
}
