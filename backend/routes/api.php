<?php

use App\Models\User;
use App\Modules\Account\Controllers\AuthController;
use App\Modules\Account\Controllers\UserController;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Modules\Reporting\Controllers\ReportingController;


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

/*----------------------------Reporting---------------------------------------*/ 

Route::prefix('v1/reports')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/dashboard', [ReportingController::class, 'dashboard']);
    Route::get('/submissions', [ReportingController::class, 'submissions']);
    Route::get('/reviews', [ReportingController::class, 'reviews']);
    Route::get('/registrations', [ReportingController::class, 'registrations']);
    Route::get('/conferences', [ReportingController::class, 'conferences']);
});
/*--------------------------------------------------------------------------- */

Route::prefix('v1/users')->middleware('auth:sanctum')->group(function () {
    Route::middleware('role:admin')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{id}', [UserController::class, 'show']);
    });
});