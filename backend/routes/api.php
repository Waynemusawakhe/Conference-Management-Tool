<?php

use App\Models\User;
use App\Modules\Account\Controllers\AuthController;
use App\Modules\Account\Controllers\UserController;
use App\Modules\Conferences\Controllers\ConferenceController;
<<<<<<< HEAD
use App\Modules\Registrations\Controllers\RegistrationController;
=======
use App\Modules\ContactMessages\Controllers\ContactMessageController;
use App\Modules\Faq\Controllers\FaqController;
use App\Modules\Registrations\Controllers\RegistrationController;
use App\Modules\Reporting\Controllers\ReportingController;
>>>>>>> origin/main
use App\Modules\Reviews\Controllers\ReviewController;
use App\Modules\Reviews\Controllers\TestimonialController;
use App\Modules\Sessions\Controllers\SessionController;
use App\Modules\Submissions\Controllers\SubmissionController;
<<<<<<< HEAD
use App\Modules\Faq\Controllers\FaqController;
use App\Modules\ContactMessages\Controllers\ContactMessageController;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Modules\Reporting\Controllers\ReportingController;


/*
|--------------------------------------------------------------------------
| Conference Routes
|--------------------------------------------------------------------------
*/

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
});

/*
|--------------------------------------------------------------------------
| Authentication Routes
=======
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication
>>>>>>> origin/main
|--------------------------------------------------------------------------
*/

Route::prefix('v1/auth')->group(function () {
<<<<<<< HEAD

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
=======
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
>>>>>>> origin/main

    Route::get('/email/verify/{id}/{hash}', function (
        Request $request,
        int $id,
        string $hash
    ) {
<<<<<<< HEAD
=======
        $frontendUrl = rtrim(
            config('app.frontend_url', 'http://localhost:5173'),
            '/'
        );

>>>>>>> origin/main
        $user = User::findOrFail($id);

        if (! hash_equals(
            (string) $hash,
            sha1($user->getEmailForVerification())
        )) {
<<<<<<< HEAD
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
=======
            return redirect()->away(
                $frontendUrl . '/email-verified?status=invalid'
            );
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->away(
                $frontendUrl . '/email-verified?status=success'
            );
>>>>>>> origin/main
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

<<<<<<< HEAD
        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully.',
        ]);
=======
        return redirect()->away(
            $frontendUrl . '/email-verified?status=success'
        );
>>>>>>> origin/main
    })
        ->middleware('signed')
        ->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {
<<<<<<< HEAD

        Route::post('/logout', [AuthController::class, 'logout']);

        Route::get('/me', [AuthController::class, 'me']);


        Route::post('/email/verification-notification', function (Request $request) {

=======
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/me', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::post('/email/verification-notification', function (
            Request $request
        ) {
>>>>>>> origin/main
            $request->user()->sendEmailVerificationNotification();

            return response()->json([
                'success' => true,
                'message' => 'Verification link sent.',
            ]);
<<<<<<< HEAD

        })
            ->middleware('throttle:6,1')
            ->name('verification.send');
    });

    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::get('/password-reset-placeholder/{token}', function () {
        // TODO: Placeholder only — real reset happens via POST /reset-password.
        // Update this once frontend URL is known.
    })
        ->name('password.reset');
=======
        })->middleware('throttle:6,1');
    });
>>>>>>> origin/main
});

/*
|--------------------------------------------------------------------------
<<<<<<< HEAD
| User Routes
=======
| Users
>>>>>>> origin/main
|--------------------------------------------------------------------------
*/

Route::prefix('v1/users')
    ->middleware('auth:sanctum')
    ->group(function () {
<<<<<<< HEAD

        Route::middleware('role:admin')->group(function () {

            Route::get('/', [UserController::class, 'index']);

=======
        Route::get('/reviewers', [UserController::class, 'reviewers'])
            ->middleware('role:admin,organiser');

        Route::middleware('role:admin')->group(function () {
            Route::get('/', [UserController::class, 'index']);
>>>>>>> origin/main
            Route::get('/{id}', [UserController::class, 'show']);
        });
    });

/*
|--------------------------------------------------------------------------
<<<<<<< HEAD
| Testimonial Routes
=======
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
>>>>>>> origin/main
|--------------------------------------------------------------------------
*/

Route::prefix('v1/testimonials')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('/', [TestimonialController::class, 'index']);
        Route::post('/', [TestimonialController::class, 'store']);
        Route::get('/{id}', [TestimonialController::class, 'show']);
        Route::put('/{id}', [TestimonialController::class, 'update']);
        Route::delete('/{id}', [TestimonialController::class, 'destroy']);
    });

/*
|--------------------------------------------------------------------------
<<<<<<< HEAD
| Registration Routes
=======
| Registrations
>>>>>>> origin/main
|--------------------------------------------------------------------------
*/

Route::prefix('v1')
    ->middleware('auth:sanctum')
    ->group(function () {
<<<<<<< HEAD
        Route::apiResource('registrations', RegistrationController::class);
    });



/*
|--------------------------------------------------------------------------
| Submissions API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')
    ->middleware('auth:sanctum')
    ->group(function () {

        Route::apiResource('submissions', SubmissionController::class)
            ->except(['edit', 'create']);

        /*
        |--------------------------------------------------------------------------
        | Submission Workflow
        |--------------------------------------------------------------------------
        */

        // Withdraw a submission
        Route::post(
            'submissions/{submission}/withdraw',
            [SubmissionController::class, 'withdraw']
=======
        Route::apiResource(
            'registrations',
            RegistrationController::class
>>>>>>> origin/main
        );
    });

/*
|--------------------------------------------------------------------------
<<<<<<< HEAD
| Sessions API Routes
=======
| Submissions
|--------------------------------------------------------------------------
*/

Route::prefix('v1')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::apiResource(
            'submissions',
            SubmissionController::class
        );

        Route::post(
            'submissions/{submission}/withdraw',
            [SubmissionController::class, 'withdraw']
        );

        Route::patch(
            'submissions/{submission}/status',
            [SubmissionController::class, 'updateStatus']
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
>>>>>>> origin/main
|--------------------------------------------------------------------------
*/

Route::prefix('v1/sessions')->group(function () {
    Route::get('/', [SessionController::class, 'index']);
<<<<<<< HEAD
    Route::get('/{id}', [SessionController::class, 'show']);
    Route::post('/', [SessionController::class, 'store']);
    Route::put('/{id}', [SessionController::class, 'update']);
    Route::delete('/{id}', [SessionController::class, 'destroy']);
});
/*
|--------------------------------------------------------------------------
| Review Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1/reviewer')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('/pending', [ReviewController::class, 'pending']);
=======
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
>>>>>>> origin/main
    });
