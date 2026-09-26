<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
    Schema::create('posts', function (Blueprint $table) {
    $table->id();

    $table->string('title', 255);

    $table->foreignId('user_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->foreignId('category_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->string('short_description', 500)->nullable();

    $table->longText('content');

    $table->enum('status', ['draft', 'published'])
        ->default('draft');

    $table->string('slug', 255)->unique();

    $table->timestamp('published_at')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
