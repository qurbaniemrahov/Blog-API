<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return view('index');
});

Route::get('/users', [UserController::class, 'index']);
Route::post('/users',[UserController::class,'store']);
