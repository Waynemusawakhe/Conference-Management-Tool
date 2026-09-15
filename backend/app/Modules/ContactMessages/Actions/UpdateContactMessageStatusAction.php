<?php

namespace App\Modules\ContactMessages\Actions;

use App\Modules\ContactMessages\Models\ContactMessage;

class UpdateContactMessageStatusAction
{
    public function execute(int $id, string $status): ContactMessage
    {
        $message = ContactMessage::findOrFail($id);
        $message->update(['status' => $status]);

        return $message->fresh();
    }
}