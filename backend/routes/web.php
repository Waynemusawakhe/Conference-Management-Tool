<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Conference Management Tool API',
        'version' => 'v1',
        'status' => 'online',
    ]);
});