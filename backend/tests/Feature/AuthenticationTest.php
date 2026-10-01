<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_log_in(): void
    {
        User::factory()->create(['email' => 'admin@example.com', 'password' => 'password', 'role' => 'admin']);

        $this->postJson('/api/login', ['email' => 'admin@example.com', 'password' => 'password'])->assertOk()->assertJsonStructure(['token', 'user']);
    }

    public function test_user_can_register_and_is_automatically_an_active_author(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Yeni İstifadəçi',
            'email' => 'new@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
            'status' => 'inactive',
        ])->assertCreated()
            ->assertJsonStructure(['message', 'user'])
            ->assertJsonMissingPath('token')
            ->assertJsonPath('user.role', 'author')
            ->assertJsonPath('user.status', 'active');

        $this->assertDatabaseHas('users', ['email' => 'new@example.com', 'role' => 'author', 'status' => 'active']);
    }

    public function test_registration_requires_a_unique_email_and_confirmed_password(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $this->postJson('/api/register', [
            'name' => 'User',
            'email' => 'existing@example.com',
            'password' => 'password',
            'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_inactive_user_cannot_log_in(): void
    {
        User::factory()->create(['email' => 'inactive@example.com', 'password' => 'password', 'status' => 'inactive']);

        $this->postJson('/api/login', ['email' => 'inactive@example.com', 'password' => 'password'])->assertUnprocessable();
    }

    public function test_inactive_user_cannot_use_an_existing_token(): void
    {
        Sanctum::actingAs(User::factory()->create(['status' => 'inactive']));

        $this->getJson('/api/user')->assertForbidden();
    }
}
