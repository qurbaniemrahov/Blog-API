<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');

Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{post}', [PostController::class, 'show']);
    Route::post('/posts', [PostController::class, 'store'])->middleware('role:admin,redaktor,author');
    Route::match(['put', 'patch'], '/posts/{post}', [PostController::class, 'update'])->middleware('role:admin,redaktor,author');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('role:admin,author');

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('role:admin,redaktor');
    Route::match(['put', 'patch'], '/categories/{category}', [CategoryController::class, 'update'])->middleware('role:admin,redaktor');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->middleware('role:admin,redaktor');

    Route::apiResource('users', UserController::class)->except('show')->middleware('role:admin');
});
