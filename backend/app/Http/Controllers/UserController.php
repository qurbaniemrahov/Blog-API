<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::query()->latest()->get());
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        return response()->json(['message' => 'İstifadəçi uğurla yaradıldı.', 'user' => $user], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user->update(array_filter($request->validated(), fn (mixed $value): bool => $value !== null));

        return response()->json(['message' => 'İstifadəçi uğurla yeniləndi.', 'user' => $user->fresh()]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->posts()->exists()) {
            return response()->json(['message' => 'Bu istifadəçinin yazıları olduğu üçün silinə bilməz.'], 409);
        }

        if (request()->user()->is($user)) {
            return response()->json(['message' => 'Öz hesabınızı silə bilməzsiniz.'], 409);
        }

        $user->delete();

        return response()->json(['message' => 'İstifadəçi uğurla silindi.']);
    }
}
