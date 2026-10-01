<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Post> */
class PostFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(5);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'user_id' => User::factory(),
            'category_id' => Category::factory(),
            'short_description' => fake()->sentence(),
            'content' => fake()->paragraphs(3, true),
            'status' => 'draft',
            'published_at' => null,
        ];
    }
}
