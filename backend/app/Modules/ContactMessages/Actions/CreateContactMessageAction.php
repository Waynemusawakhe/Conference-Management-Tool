<?php

namespace App\Modules\ContactMessages\Actions;

use App\Modules\ContactMessages\Models\ContactMessage;

class CreateContactMessageAction
{
    public function execute(array $data, ?int $userId = null): ContactMessage
    {
        $data['user_id'] = $userId;
        $data['status'] = 'new';

        return ContactMessage::create($data);
    }
}