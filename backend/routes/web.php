<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'Conference Management Tool API',
        'version' => 'v1',
        'status' => 'online',
    ], 200);
});
