<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => [
                'required',
                Rule::in(['admin', 'editor', 'author']),
            ],
            'status' => [
                'required',
                Rule::in(['active', 'deactive']),
            ],
        ]);

        $user = User::create($validated);

        return response()->json([
            'message' => 'İstifadəçi uğurla yaradıldı.',
            'user' => $user,
        ], 201);
    }
}
