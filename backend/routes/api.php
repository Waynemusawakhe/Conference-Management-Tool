<?php

use App\Models\User;
use App\Modules\Account\Controllers\AuthController;
use App\Modules\Account\Controllers\UserController;
use App\Modules\Conferences\Controllers\ConferenceController;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/conferences')->group(function () {

    // Public
    Route::get('/', [ConferenceController::class, 'index']);
    Route::get('/{conference}', [ConferenceController::class, 'show']);

    // Authenticated
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [ConferenceController::class, 'store']);
        Route::put('/{conference}', [ConferenceController::class, 'update']);
        Route::delete('/{conference}', [ConferenceController::class, 'destroy']);

        Route::patch('/{conference}/status', [ConferenceController::class, 'updateStatus']);
        Route::get('/{conference}/submissions', [ConferenceController::class, 'submissions']);
        Route::get('/{conference}/registrations', [ConferenceController::class, 'registrations']);
        Route::get('/{conference}/sessions', [ConferenceController::class, 'sessions']);
    });
}); // ✅ closes the conference group properly

Route::prefix('v1/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::get('/email/verify/{id}/{hash}', function (Request $request, int $id, string $hash) {
        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification link.',
            ], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Email already verified.',
            ]);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully.',
        ]);
    })->middleware('signed')->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        Route::post('/email/verification-notification', function (Request $request) {
            $request->user()->sendEmailVerificationNotification();

            return response()->json([
                'success' => true,
                'message' => 'Verification link sent.',
            ]);
        })->middleware('throttle:6,1')->name('verification.send');
    });
});

Route::prefix('v1/users')->middleware('auth:sanctum')->group(function () {
    Route::middleware('role:admin')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{id}', [UserController::class, 'show']);
    });
});

// Registrations API Routes
Route::prefix('v1')->group(function () {
    Route::apiResource('registrations', \App\Modules\Registrations\Controllers\RegistrationController::class);
});

