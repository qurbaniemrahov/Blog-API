<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'user_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:users,id',
            ],

            'category_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:categories,id',
            ],

            'short_description' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],

            'content' => [
                'sometimes',
                'required',
                'string',
            ],

            'status' => [
                'sometimes',
                'required',
                Rule::in(['draft', 'published']),
            ],
        ];
    }
}
