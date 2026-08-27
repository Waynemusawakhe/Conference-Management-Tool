<?php

namespace App\Modules\Reviews\Requests;

use App\Models\User;
use App\Modules\Shared\Requests\BaseApiRequest;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CreateReviewRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'submission_id' => [
                'required',
                'integer',
                Rule::exists(Submission::class, 'id'),
            ],
            'reviewer_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'submission_id.required' => 'Submission ID is required.',
            'submission_id.exists' => 'The selected submission does not exist.',
            'reviewer_id.required' => 'Reviewer ID is required.',
            'reviewer_id.exists' => 'The selected reviewer does not exist.',
        ];
    }
}
