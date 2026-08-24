<?php

use App\Modules\Account\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Modules\Conferences\Controllers\ConferenceController;

Route::prefix('v1/conferences')->group(function () {

    // Public
    Route::get('/', [ConferenceController::class, 'index']);
    Route::get('/{conference}', [ConferenceController::class, 'show']);

    // Authenticated
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [ConferenceController::class, 'store']);
        Route::put('/{conference}', [ConferenceController::class, 'update']);
        Route::delete('/{conference}', [ConferenceController::class, 'destroy']);

        Route::patch(
            '/{conference}/status',
            [ConferenceController::class, 'updateStatus']
        );

        Route::get(
            '/{conference}/submissions',
            [ConferenceController::class, 'submissions']
        );

        Route::get(
            '/{conference}/registrations',
            [ConferenceController::class, 'registrations']
        );

        Route::get(
            '/{conference}/sessions',
            [ConferenceController::class, 'sessions']
        );
    });
});