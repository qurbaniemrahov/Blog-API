<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_posts(): void
    {
        $this->getJson('/api/posts')->assertUnauthorized();
    }

    public function test_a_post_can_be_stored_with_a_unique_slug(): void
    {
        $user = User::factory()->create(['role' => 'redaktor']);
        $category = Category::create(['name' => 'Test', 'slug' => 'test']);
        Sanctum::actingAs($user);
        $payload = ['title' => 'İlk yazı', 'user_id' => $user->id, 'category_id' => $category->id, 'content' => 'Məzmun', 'status' => 'draft'];

        $this->postJson('/api/posts', $payload)->assertCreated()->assertJsonPath('post.slug', 'ilk-yazi');
        $this->postJson('/api/posts', $payload)->assertCreated()->assertJsonPath('post.slug', 'ilk-yazi-1');
    }

    public function test_publishing_and_returning_to_draft_updates_published_at(): void
    {
        $user = User::factory()->create(['role' => 'redaktor']);
        $category = Category::create(['name' => 'Test', 'slug' => 'test']);
        $post = Post::create(['title' => 'Post', 'slug' => 'post', 'user_id' => $user->id, 'category_id' => $category->id, 'content' => 'Məzmun', 'status' => 'draft']);
        Sanctum::actingAs($user);

        $this->patchJson("/api/posts/{$post->id}", ['status' => 'published'])->assertOk();
        $this->assertNotNull($post->fresh()->published_at);
        $this->patchJson("/api/posts/{$post->id}", ['status' => 'draft'])->assertOk();
        $this->assertNull($post->fresh()->published_at);
    }

    public function test_author_can_read_but_cannot_modify_another_authors_post(): void
    {
        $author = User::factory()->create(['role' => 'author']);
        $other = User::factory()->create(['role' => 'author']);
        $category = Category::create(['name' => 'Test', 'slug' => 'test']);
        $post = Post::create(['title' => 'Post', 'slug' => 'post', 'user_id' => $other->id, 'category_id' => $category->id, 'content' => 'Məzmun', 'status' => 'draft']);
        Sanctum::actingAs($author);

        $this->getJson('/api/posts')->assertOk()->assertJsonFragment(['id' => $post->id]);
        $this->getJson("/api/posts/{$post->id}")->assertOk()->assertJsonPath('id', $post->id);
        $this->patchJson("/api/posts/{$post->id}", ['title' => 'Changed'])->assertForbidden();
        $this->deleteJson("/api/posts/{$post->id}")->assertForbidden();
    }

    public function test_editor_can_edit_but_cannot_delete_a_post(): void
    {
        $editor = User::factory()->create(['role' => 'redaktor']);
        $author = User::factory()->create(['role' => 'author']);
        $category = Category::create(['name' => 'Test', 'slug' => 'test']);
        $post = Post::create(['title' => 'Post', 'slug' => 'post', 'user_id' => $author->id, 'category_id' => $category->id, 'content' => 'Məzmun', 'status' => 'draft']);
        Sanctum::actingAs($editor);

        $this->patchJson("/api/posts/{$post->id}", ['title' => 'Redaktə edilmiş'])->assertOk();
        $this->deleteJson("/api/posts/{$post->id}")->assertForbidden();
    }

    public function test_admin_can_edit_and_delete_any_post(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $author = User::factory()->create(['role' => 'author']);
        $category = Category::create(['name' => 'Test', 'slug' => 'test']);
        $post = Post::create(['title' => 'Post', 'slug' => 'post', 'user_id' => $author->id, 'category_id' => $category->id, 'content' => 'Məzmun', 'status' => 'draft']);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/posts/{$post->id}", ['title' => 'Admin redaktəsi'])->assertOk();
        $this->deleteJson("/api/posts/{$post->id}")->assertOk();
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }
}
