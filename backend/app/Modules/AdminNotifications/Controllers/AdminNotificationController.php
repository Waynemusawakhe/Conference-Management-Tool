<?php

namespace App\Modules\AdminNotifications\Controllers;

use App\Http\Controllers\Controller;
use App\Models\NotificationCampaign;
use App\Models\NotificationTemplate;
use App\Models\User;
use App\Notifications\CmtNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class AdminNotificationController extends Controller
{
    public function templates(): JsonResponse
    {
        return response()->json([
            'data' => NotificationTemplate::query()
                ->with('creator:id,name,email')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:180'],
            'message' => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'string', 'max:2048'],
            'default_channels' => ['nullable', 'array', 'min:1'],
            'default_channels.*' => ['in:database,mail'],
        ]);

        $template = NotificationTemplate::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'default_channels' => $validated['default_channels']
                ?? ['database'],
        ]);

        return response()->json([
            'data' => $template->load('creator:id,name,email'),
        ], 201);
    }

    public function updateTemplate(
        Request $request,
        NotificationTemplate $template
    ): JsonResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:180'],
            'message' => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'string', 'max:2048'],
            'default_channels' => ['required', 'array', 'min:1'],
            'default_channels.*' => ['in:database,mail'],
        ]);

        $template->update($validated);

        return response()->json([
            'data' => $template->fresh('creator:id,name,email'),
        ]);
    }

    public function destroyTemplate(
        NotificationTemplate $template
    ): JsonResponse {
        $template->delete();

        return response()->json([], 204);
    }

    public function history(): JsonResponse
    {
        return response()->json([
            'data' => NotificationCampaign::query()
                ->with([
                    'sender:id,name,email',
                    'template:id,name',
                ])
                ->latest('sent_at')
                ->paginate(30),
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => [
                'nullable',
                'integer',
                'exists:notification_templates,id',
            ],
            'title' => ['required', 'string', 'max:180'],
            'message' => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'string', 'max:2048'],
            'target_type' => ['required', 'in:user,role,all'],
            'target_user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'target_role' => [
                'nullable',
                'in:admin,organiser,reviewer,author,attendee',
            ],
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => ['in:database,mail'],
        ]);

        if (
            $validated['target_type'] === 'user'
            && empty($validated['target_user_id'])
        ) {
            return response()->json([
                'message' => 'Choose a user to receive this notification.',
                'errors' => [
                    'target_user_id' => [
                        'Choose a user to receive this notification.',
                    ],
                ],
            ], 422);
        }

        if (
            $validated['target_type'] === 'role'
            && empty($validated['target_role'])
        ) {
            return response()->json([
                'message' => 'Choose a role to receive this notification.',
                'errors' => [
                    'target_role' => [
                        'Choose a role to receive this notification.',
                    ],
                ],
            ], 422);
        }

        $recipients = match ($validated['target_type']) {
            'user' => User::query()
                ->whereKey($validated['target_user_id'])
                ->get(),

            'role' => User::query()
                ->where('role', $validated['target_role'])
                ->get(),

            default => User::query()->get(),
        };

        $targetValue = match ($validated['target_type']) {
            'user' => (string) $validated['target_user_id'],
            'role' => $validated['target_role'],
            default => null,
        };

        $campaign = NotificationCampaign::create([
            'template_id' => $validated['template_id'] ?? null,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'action_url' => $validated['action_url'] ?? null,
            'target_type' => $validated['target_type'],
            'target_value' => $targetValue,
            'channels' => $validated['channels'],
            'recipient_count' => $recipients->count(),
            'sent_by' => $request->user()->id,
            'sent_at' => now(),
        ]);

        Notification::send(
            $recipients,
            new CmtNotification(
                title: $campaign->title,
                message: $campaign->message,
                actionUrl: $campaign->action_url,
                kind: 'announcement',
                metadata: [
                    'campaign_id' => $campaign->id,
                    'sent_by' => $request->user()->id,
                ],
                channels: $campaign->channels,
            )
        );

        return response()->json([
            'message' => 'Notification sent successfully.',
            'data' => $campaign->load([
                'sender:id,name,email',
                'template:id,name',
            ]),
        ], 201);
    }
}
