<?php

namespace App\Modules\ContactMessages\Actions;

use App\Modules\ContactMessages\Models\ContactMessage;

class GetContactMessageAction
{
    public function execute(int $id): ContactMessage
    {
        return ContactMessage::findOrFail($id);
    }
}