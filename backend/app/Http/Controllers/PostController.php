<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function index(): JsonResponse
    {
        $posts = Post::query()
            ->with(['author', 'category'])
            ->latest()
            ->get();

        return response()->json($posts);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $validated = $request->validated();

        abort_if($request->user()->role === 'author' && $validated['user_id'] !== $request->user()->id, 403, 'Yalnız öz adınızdan yazı yarada bilərsiniz.');

        $validated['slug'] = $this->generateUniqueSlug(
            $validated['title']
        );

        $validated['published_at'] =
            $validated['status'] === 'published'
                ? now()
                : null;

        $post = Post::create($validated);

        $post->load(['author', 'category']);

        return response()->json([
            'message' => 'Yazı uğurla yaradıldı.',
            'post' => $post,
        ], 201);
    }

    public function show(Post $post): JsonResponse
    {
        $post->load(['author', 'category']);

        return response()->json($post);
    }

    public function update(
        UpdatePostRequest $request,
        Post $post
    ): JsonResponse {
        $this->authorizeAuthorAccess($post);
        $validated = $request->validated();

        abort_if($request->user()->role === 'author' && isset($validated['user_id']) && $validated['user_id'] !== $request->user()->id, 403, 'Yazının müəllifini dəyişə bilməzsiniz.');

        if (
            isset($validated['title']) &&
            $validated['title'] !== $post->title
        ) {
            $validated['slug'] = $this->generateUniqueSlug(
                $validated['title'],
                $post->id
            );
        }

        if (isset($validated['status'])) {
            if (
                $validated['status'] === 'published' &&
                $post->published_at === null
            ) {
                $validated['published_at'] = now();
            }

            if ($validated['status'] === 'draft') {
                $validated['published_at'] = null;
            }
        }

        $post->update($validated);

        $post->load(['author', 'category']);

        return response()->json([
            'message' => 'Yazı uğurla yeniləndi.',
            'post' => $post,
        ]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorizeAuthorAccess($post);
        $post->delete();

        return response()->json([
            'message' => 'Yazı uğurla silindi.',
        ]);
    }

    private function generateUniqueSlug(
        string $title,
        ?int $ignorePostId = null
    ): string {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (
            Post::query()
                ->where('slug', $slug)
                ->when(
                    $ignorePostId,
                    fn ($query) => $query->where(
                        'id',
                        '!=',
                        $ignorePostId
                    )
                )
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    private function authorizeAuthorAccess(Post $post): void
    {
        abort_if(
            request()->user()->role === 'author' && $post->user_id !== request()->user()->id,
            403,
            'Yalnız öz yazılarınızı idarə edə bilərsiniz.'
        );
    }
}
