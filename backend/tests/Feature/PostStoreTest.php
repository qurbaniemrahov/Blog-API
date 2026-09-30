<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_post_can_be_stored(): void
    {
        $user = User::factory()->create();
        $category = Category::create([
            'name' => 'Test category',
            'slug' => 'test-category',
            'description' => null,
        ]);

        $response = $this->postJson('/api/posts', [
            'title' => 'My first post',
            'user_id' => $user->id,
            'category_id' => $category->id,
            'short_description' => 'A short description.',
            'content' => 'The full post content.',
            'status' => 'draft',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('post.title', 'My first post')
            ->assertJsonPath('post.slug', 'my-first-post');

        $this->assertDatabaseHas('posts', [
            'title' => 'My first post',
            'user_id' => $user->id,
            'category_id' => $category->id,
            'status' => 'draft',
            'slug' => 'my-first-post',
            'published_at' => null,
        ]);
    }
}
