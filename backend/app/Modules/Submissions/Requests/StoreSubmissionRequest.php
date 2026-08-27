<?php

namespace App\Modules\Submissions\Requests;

use App\Modules\Conferences\Models\Conference;
use Illuminate\Foundation\Http\FormRequest;

class StoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'conference_id' => ['required', 'integer', 'exists:conferences,id'],
            'title' => ['required', 'string', 'max:255'],
            'track' => ['nullable', 'string', 'max:255'],
            'abstract' => ['required', 'string', 'max:5000'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $conference = Conference::find($this->input('conference_id'));

            if ($conference && method_exists($conference, 'isAcceptingSubmissions')
                && ! $conference->isAcceptingSubmissions()) {
                $validator->errors()->add(
                    'conference_id',
                    'This conference is not currently accepting submissions.'
                );
            }
        });
    }
}
