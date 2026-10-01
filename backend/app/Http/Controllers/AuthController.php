<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            ...$request->safe()->only(['name', 'email', 'password']),
            'role' => 'author',
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Qeydiyyat uğurla tamamlandı. İndi hesabınıza daxil ola bilərsiniz.',
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password ?? '')) {
            throw ValidationException::withMessages(['email' => ['E-poçt və ya şifrə yanlışdır.']]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages(['email' => ['Bu istifadəçi hesabı deaktivdir.']]);
        }

        $user->tokens()->delete();

        return response()->json(['token' => $user->createToken('blog-console')->plainTextToken, 'user' => $user]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sessiya bağlandı.']);
    }
}
