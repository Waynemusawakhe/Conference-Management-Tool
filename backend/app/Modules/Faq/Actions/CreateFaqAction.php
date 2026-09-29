<?php

namespace App\Modules\Faq\Actions;

use App\Modules\Faq\Models\Faq;

class CreateFaqAction
{
    public function execute(array $data): Faq
    {
        return Faq::create($data);
    }
}