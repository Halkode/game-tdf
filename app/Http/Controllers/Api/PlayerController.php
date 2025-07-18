<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function novoPlayer(Request $request)
    {
        

        // Retorna o ID do novo player criado
        return response()->json(['player_id' => $player], 201);
    }

    public function getCenaAtual(Request $request)
    {
        // Supondo que o ID da cena atual venha na requisição (ex: ?scene_id=1)
        $sceneId = $request->input('scene_id');

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
