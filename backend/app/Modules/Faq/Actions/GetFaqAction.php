<?php

namespace App\Modules\Faq\Actions;

use App\Modules\Faq\Models\Faq;

class GetFaqAction
{
    public function execute(int $id): Faq
    {
        return Faq::findOrFail($id);
    }
}