<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\SubmissionReview;

class GetReviewAction
{
    public function execute(int $id): SubmissionReview
    {
        return SubmissionReview::with(['submission', 'reviewer'])->findOrFail($id);
    }
}
