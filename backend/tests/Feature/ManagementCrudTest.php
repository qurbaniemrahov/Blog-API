<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ManagementCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_admin_can_manage_users(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'author']));
        $this->getJson('/api/users')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->postJson('/api/users', ['name' => 'New User', 'email' => 'new@example.com', 'password' => 'password', 'role' => 'author', 'status' => 'active'])->assertCreated();
        $this->assertDatabaseHas('users', ['email' => 'new@example.com']);
    }

    public function test_category_with_posts_cannot_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'Test', 'slug' => 'test']);
        Post::create(['title' => 'Post', 'slug' => 'post', 'user_id' => $admin->id, 'category_id' => $category->id, 'content' => 'Məzmun', 'status' => 'draft']);
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/categories/{$category->id}")->assertConflict();
    }
}
