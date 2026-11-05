<?php

namespace App\Modules\Audit\Actions;

use App\Models\User;
use App\Modules\Audit\Models\AuditLog;

class RecordAuditLogAction
{
    public function execute(
        User $actor,
        ?User $target,
        string $action,
        ?array $oldValues = null,
        ?array $newValues = null
    ): AuditLog {
        return AuditLog::create([
            'actor_user_id' => $actor->id,
            'target_user_id' => $target?->id,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
