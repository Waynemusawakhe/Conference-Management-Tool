<?php

use App\Models\User;
use App\Modules\Account\Controllers\AuthController;
use App\Modules\Account\Controllers\UserController;
use App\Modules\Conferences\Controllers\ConferenceController;
use App\Modules\ContactMessages\Controllers\ContactMessageController;
use App\Modules\Faq\Controllers\FaqController;
use App\Modules\Registrations\Controllers\RegistrationController;
use App\Modules\Reporting\Controllers\ReportingController;
use App\Modules\Reviews\Controllers\ReviewController;
use App\Modules\Reviews\Controllers\TestimonialController;
use App\Http\Controllers\NotificationController;
use App\Modules\Sessions\Controllers\SessionController;
use App\Modules\Submissions\Controllers\SubmissionController;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Public Authentication Routes
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/register',
        [AuthController::class, 'register']
    )->middleware('throttle:5,1');

    Route::post(
        '/login',
        [AuthController::class, 'login']
    )->middleware('throttle:5,1');

    Route::post(
        '/forgot-password',
        [AuthController::class, 'forgotPassword']
    )->middleware('throttle:5,1');

    Route::post(
        '/reset-password',
        [AuthController::class, 'resetPassword']
    )->middleware('throttle:5,1');


    /*
    |--------------------------------------------------------------------------
    | Email Verification
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/email/verify/{id}/{hash}',
        function (
            Request $request,
            int $id,
            string $hash
        ) {
            $frontendUrl = rtrim(
                config(
                    'app.frontend_url',
                    'http://localhost:3000'
                ),
                '/'
            );

            $user = User::findOrFail($id);

            /*
             * Protect against a verification URL being
             * used for a different email address.
             */
            if (! hash_equals(
                (string) $hash,
                sha1(
                    $user->getEmailForVerification()
                )
            )) {
                return redirect()->away(
                    $frontendUrl .
                    '/email-verified?status=invalid'
                );
            }

            /*
             * Already verified.
             */
            if ($user->hasVerifiedEmail()) {
                return redirect()->away(
                    $frontendUrl .
                    '/email-verified?status=success'
                );
            }

            /*
             * Verify the email.
             */
            if ($user->markEmailAsVerified()) {
                event(
                    new Verified($user)
                );
            }

            return redirect()->away(
                $frontendUrl .
                '/email-verified?status=success'
            );
        }
    )
        ->middleware([
            'signed',
            'throttle:6,1',
        ])
        ->name('verification.verify');


    /*
    |--------------------------------------------------------------------------
    | Resend Verification Email
    |--------------------------------------------------------------------------
    |
    | This route is intentionally public because an unverified user cannot
    | log in and therefore cannot receive a Sanctum token.
    |
    */

    Route::post(
        '/email/verification-notification',
        function (Request $request) {

            $validated = $request->validate([
                'email' => [
                    'required',
                    'email',
                ],
            ]);

            $email = strtolower(
                trim($validated['email'])
            );

            $user = User::where(
                'email',
                $email
            )->first();

            /*
             * Always return a generic response.
             *
             * This avoids exposing whether an email
             * address exists in the system.
             */
            if (
                ! $user ||
                $user->hasVerifiedEmail()
            ) {
                return response()->json([
                    'success' => true,
                    'message' =>
                        'If the account requires verification, a verification link will be sent.',
                ]);
            }

            $user->sendEmailVerificationNotification();

            return response()->json([
                'success' => true,
                'message' =>
                    'If the account requires verification, a verification link will be sent.',
            ]);
        }
    )->middleware('throttle:6,1');


    /*
    |--------------------------------------------------------------------------
    | Authenticated Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware(
        'auth:sanctum'
    )->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Current User
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/me',
            [AuthController::class, 'me']
        );

        Route::patch(
            '/me',
            [AuthController::class, 'updateProfile']
        );

        Route::delete(
            '/me',
            [AuthController::class, 'deleteAccount']
        );

        /*
        |--------------------------------------------------------------------------
        | Password
        |--------------------------------------------------------------------------
        */

        Route::put(
            '/password',
            [AuthController::class, 'changePassword']
        );

        /*
        |--------------------------------------------------------------------------
        | Logout
        |--------------------------------------------------------------------------
        */

        Route::post(
            '/logout',
            [AuthController::class, 'logout']
        );


        /*
        |--------------------------------------------------------------------------
        | Notifications
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/notifications',
            [NotificationController::class, 'index']
        );

        Route::get(
            '/notifications/unread-count',
            [NotificationController::class, 'unreadCount']
        );

        Route::post(
            '/notifications/{id}/read',
            [NotificationController::class, 'read']
        );

        Route::post(
            '/notifications/read-all',
            [NotificationController::class, 'readAll']
        );
    });
});

/*
|--------------------------------------------------------------------------
| Users
|--------------------------------------------------------------------------
*/

Route::prefix('v1/users')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('/reviewers', [UserController::class, 'reviewers'])
            ->middleware('role:admin,organiser');

        Route::middleware('role:admin')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::get('/{id}', [UserController::class, 'show']);
        });
    });

/*
|--------------------------------------------------------------------------
| Conferences
|--------------------------------------------------------------------------
*/

Route::prefix('v1/conferences')->group(function () {
    Route::get('/', [ConferenceController::class, 'index']);
    Route::get('/{conference}', [ConferenceController::class, 'show']);

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

/*
|--------------------------------------------------------------------------
| FAQs
|--------------------------------------------------------------------------
*/

Route::prefix('v1/faqs')->group(function () {
    Route::get('/', [FaqController::class, 'index']);
    Route::get('/{id}', [FaqController::class, 'show']);

    Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::post('/', [FaqController::class, 'store']);
        Route::put('/{id}', [FaqController::class, 'update']);
        Route::delete('/{id}', [FaqController::class, 'destroy']);
    });
});

/*
|--------------------------------------------------------------------------
| Contact Messages
|--------------------------------------------------------------------------
*/

Route::prefix('v1/contact-messages')->group(function () {
    Route::post('/', [ContactMessageController::class, 'store'])
        ->middleware('throttle:6,1');

    Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/', [ContactMessageController::class, 'index']);
        Route::get('/{id}', [ContactMessageController::class, 'show']);

        Route::patch(
            '/{id}/status',
            [ContactMessageController::class, 'updateStatus']
        );

        Route::delete('/{id}', [ContactMessageController::class, 'destroy']);
    });
});

/*
|--------------------------------------------------------------------------
| Testimonials
|--------------------------------------------------------------------------
*/

Route::prefix('v1/testimonials')->group(function () {

    /*
     * Public read access.
     */
    Route::get(
        '/',
        [TestimonialController::class, 'index']
    );

    Route::get(
        '/{id}',
        [TestimonialController::class, 'show']
    );

    /*
     * Creating, updating and deleting testimonials
     * requires authentication.
     */
    Route::middleware('auth:sanctum')
            ->group(function () {
                Route::post(
                    '/',
                    [TestimonialController::class, 'store']
                );

                Route::put(
                    '/{id}',
                    [TestimonialController::class, 'update']
                );

                Route::delete(
                    '/{id}',
                    [TestimonialController::class, 'destroy']
                );
            });
    });

/*
|--------------------------------------------------------------------------
| Registrations
|--------------------------------------------------------------------------
*/

Route::prefix('v1')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::apiResource(
            'registrations',
            RegistrationController::class
        );
    });

/*
|--------------------------------------------------------------------------
| Submissions
|--------------------------------------------------------------------------
*/

Route::prefix('v1')
    ->middleware('auth:sanctum')
    ->group(function () {

        Route::get(
            'submissions/{submission}/file',
            [
                SubmissionController::class,
                'downloadFile',
            ]
        );

        Route::apiResource(
            'submissions',
            SubmissionController::class
        );

        Route::post(
            'submissions/{submission}/withdraw',
            [
                SubmissionController::class,
                'withdraw',
            ]
        );

        Route::patch(
            'submissions/{submission}/status',
            [
                SubmissionController::class,
                'updateStatus',
            ]
        );
    });

/*
|--------------------------------------------------------------------------
| Reviews
|--------------------------------------------------------------------------
*/

Route::prefix('v1/reviews')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('/pending', [ReviewController::class, 'pending']);
        Route::get('/', [ReviewController::class, 'index']);
        Route::get('/{id}', [ReviewController::class, 'show']);
        Route::post('/', [ReviewController::class, 'store']);

        Route::post(
            '/{id}/submit',
            [ReviewController::class, 'submit']
        );

        Route::post(
            '/{id}/lock',
            [ReviewController::class, 'lock']
        );

        Route::delete('/{id}', [ReviewController::class, 'destroy']);
    });

/*
|--------------------------------------------------------------------------
| Sessions
|--------------------------------------------------------------------------
*/

Route::prefix('v1/sessions')->group(function () {
    Route::get('/', [SessionController::class, 'index']);
    Route::get('/{session}', [SessionController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [SessionController::class, 'store']);
        Route::put('/{session}', [SessionController::class, 'update']);
        Route::delete('/{session}', [SessionController::class, 'destroy']);
    });
});

/*
|--------------------------------------------------------------------------
| Reporting
|--------------------------------------------------------------------------
*/

Route::prefix('v1/reports')
    ->middleware(['auth:sanctum', 'role:admin'])
    ->group(function () {
        Route::get('/dashboard', [ReportingController::class, 'dashboard']);
        Route::get('/submissions', [ReportingController::class, 'submissions']);
        Route::get('/reviews', [ReportingController::class, 'reviews']);
        Route::get('/registrations', [ReportingController::class, 'registrations']);
        Route::get('/conferences', [ReportingController::class, 'conferences']);
    });