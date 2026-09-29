<?php

namespace App\Modules\Faq\Actions;

use App\Modules\Faq\Models\Faq;

class UpdateFaqAction
{
    public function execute(int $id, array $data): Faq
    {
        $faq = Faq::findOrFail($id);
        $faq->update($data);

        return $faq->fresh();
    }
}