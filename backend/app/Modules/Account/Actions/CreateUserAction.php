<?php

namespace App\Modules\Account\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateUserAction
{
    public function execute(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
<<<<<<< HEAD
            'role' => $data['role'] 
=======
            'role' => $data['role'],
>>>>>>> origin/main
        ]);

        $user->sendEmailVerificationNotification();

        return $user;
    }
}
