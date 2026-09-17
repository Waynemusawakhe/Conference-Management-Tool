<?php

namespace App\Modules\Faq\Actions;

use App\Modules\Faq\Models\Faq;

class DeleteFaqAction
{
    public function execute(int $id): void
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();
    }
}