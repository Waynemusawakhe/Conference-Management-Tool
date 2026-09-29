<?php

namespace App\Modules\Sessions\Requests;

use App\Modules\Shared\Requests\BaseApiRequest;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Validation\Rule;

class UpdateSessionRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $session = $this->route('session');

        $sessionId = $session?->id;

        return [
            'conference_id' => [
                'sometimes',
                'integer',
                'exists:conferences,id',
            ],
            'submission_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:submissions,id',
                Rule::unique(
                    'conference_sessions',
                    'submission_id'
                )->ignore($sessionId),
            ],
            'title' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'track' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'room' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'scheduled_time' => [
                'sometimes',
                'date',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $session = $this->route('session');

            $conferenceId = $this->integer('conference_id')
                ?: $session?->conference_id;

            $submissionId = $this->has('submission_id')
                ? $this->input('submission_id')
                : $session?->submission_id;

            if (! $submissionId || ! $conferenceId) {
                return;
            }

            $submission = Submission::find($submissionId);

            if (
                $submission
                && $submission->conference_id !== (int) $conferenceId
            ) {
                $validator->errors()->add(
                    'submission_id',
                    'The submission must belong to the selected conference.'
                );
            }
        });
    }
}