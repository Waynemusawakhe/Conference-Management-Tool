<?php

namespace App\Modules\ContactMessages\Actions;

use App\Modules\ContactMessages\Models\ContactMessage;

class DeleteContactMessageAction
{
    public function execute(int $id): void
    {
        $message = ContactMessage::findOrFail($id);
        $message->delete();
    }
}