<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Reporting\Requests\ReportingFilterRequest;
use App\Modules\Submissions\Models\Submission;

class GetSubmissionStatisticsAction
{
    public function execute(ReportingFilterRequest $request): array /* the method will return an array */
    {
        $query = Submission::query();/*Start the DB query */

        /*Filter by conference id */
        if ($request->filled('conference_id')) {
            $query->where('conference_id', $request->integer('conference_id'));
        }

        /*Filter by status */
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }


        /*Filter by starting date created */
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }


        /*Filter by ending date*/
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        /** Calculate the total of submissions that match all filters */
        $total = (clone $query)->count();

        $byStatus = (clone $query)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return [
            'total' => $total,
            'by_status' => [
                'pending' => (int) ($byStatus['pending'] ?? 0),
                'under_review' => (int) ($byStatus['under_review'] ?? 0),
                'accepted' => (int) ($byStatus['accepted'] ?? 0),
                'rejected' => (int) ($byStatus['rejected'] ?? 0),
                'revision_requested' => (int) ($byStatus['revision_requested'] ?? 0),
            ],
        ];
    }
}