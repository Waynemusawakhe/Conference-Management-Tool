<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class GetRegistrationAction
{
    public function execute(int $id): Registration
    {
        return Registration::with(['conference', 'user'])->findOrFail($id);
    }
}
