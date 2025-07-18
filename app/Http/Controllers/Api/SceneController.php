<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\Scene;
use App\Http\Controllers\Controller;

class SceneController extends Controller
{
    public function storeComItens(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'nullable|string',
            'environment' => 'nullable|array',
            'background_image' => 'nullable|string',
            'audio_cue' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.name' => 'required|string',
            'items.*.icon' => 'required|string',
            'items.*.type' => 'required|string',
            'items.*.is_pickable' => 'required|boolean',
            'items.*.position_x' => 'required|integer',
            'items.*.position_y' => 'required|integer',
        ]);

        $scene = Scene::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? null,
            'environment' => $data['environment'] ?? [],
            'background_image' => $data['background_image'] ?? null,
            'audio_cue' => $data['audio_cue'] ?? null,
        ]);

        if (isset($data['items'])) {
            foreach ($data['items'] as $itemData) {
                $scene->items()->create($itemData);
            }
        }

        return response()->json($scene->load('items'));
    }

    public function show($id)
    {
        $scene = Scene::with(['items', 'tiles'])->findOrFail($id);
        return response()->json([
            'scene' => [
                'id' => $scene->id,
                'title' => $scene->title,
                'tiles' => $scene->tiles,
                'items' => $scene->items,
            ]
        ]);
    }
}
