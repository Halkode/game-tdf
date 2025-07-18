<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Item;

class GameController extends Controller
{
    public function novoJogo(Request $request)
    {
        
        return response()->json(['player_id' => $player], 201);
    }

    public function itens()
    {
        


        return response()->json([
            ['id' => 1, 'x' => 60, 'y' => 80, 'w' => 40, 'h' => 40, 'label' => 'Espada'],
            ['id' => 2, 'x' => 160, 'y' => 120, 'w' => 30, 'h' => 30, 'label' => 'Poção'],
            // ...outros itens
        ]);
    }


    public function loadGame(Request $request)
    {
        // Supondo que o ID da cena atual venha na requisição (ex: ?scene_id=1)
        $sceneId = '';

        if (!$sceneId) {
            return response()->json(['erro' => 'ID da cena não fornecido.'], 400);
        }

        $scene = \App\Models\Scene::find($sceneId);

        if (!$scene) {
            return response()->json(['erro' => 'Cena não encontrada.'], 404);
        }

        return response()->json($scene);
    }
}
