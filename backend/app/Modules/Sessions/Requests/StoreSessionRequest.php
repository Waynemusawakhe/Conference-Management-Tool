<?php

namespace App\Modules\Sessions\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Validation\Rule;

class StoreSessionRequest extends BaseApiRequest
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
                'exists:conferences,id',
            ],
            'submission_id' => [
                'nullable',
                'integer',
                'exists:submissions,id',
                Rule::unique(
                    'conference_sessions',
                    'submission_id'
                ),
            ],
            'title' => [
                'nullable',
                'string',
                'max:255',
            ],
            'track' => [
                'nullable',
                'string',
                'max:255',
            ],
            'room' => [
                'nullable',
                'string',
                'max:255',
            ],
            'scheduled_time' => [
                'required',
                'date',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (
                ! $this->filled('submission_id')
                || ! $this->filled('conference_id')
            ) {
                return;
            }

            $submission = Submission::find(
                $this->integer('submission_id')
            );

            if (
                $submission
                && $submission->conference_id
                    !== $this->integer('conference_id')
            ) {
                $validator->errors()->add(
                    'submission_id',
                    'The submission must belong to the selected conference.'
                );
            }
        });
    }
}