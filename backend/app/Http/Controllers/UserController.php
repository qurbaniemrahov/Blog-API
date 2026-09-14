<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{

   public function index() {
          $users = User::latest()->get();

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => [
                'required',
                Rule::in(['admin', 'redaktor', 'author']),
            ],
            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ]);

        $user = User::create($validated);

        return response()->json([
            'message' => 'İstifadəçi uğurla yaradıldı.',
            'user' => $user,
        ], 201);
    }
}
