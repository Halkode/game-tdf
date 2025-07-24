<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\Player;
use App\Models\Scene;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    /**
     * Inicia um novo jogo, criando um novo jogador e definindo seu estado inicial.
     */
    public function novoJogo(Request $request)
    {
        DB::beginTransaction();
        try {
            $initialScene = Scene::where("title", "Abrigo Isolado")->first();

            if (!$initialScene) {
                return response()->json(["error" => "Cena inicial 'Abrigo Isolado' não encontrada."], 500);
            }

            $player = Player::create([
                "current_scene_id" => $initialScene->id,
                "hunger" => 100, 
                "thirst" => 100, 
                "sanity" => 100,
                "fatigue" => 0, 
                "status" => "normal",
                "clothing_json" => json_encode([]),
            ]);

            DB::commit();
            return response()->json(["message" => "Novo jogo iniciado com sucesso!", "player_id" => $player->id], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(["error" => "Erro ao iniciar novo jogo: " . $e->getMessage()], 500);
        }
    }

    /**
     * Retorna os itens da cena atual do jogador.
     */
    public function getSceneItems(Request $request)
    {
        $playerId = $request->input("player_id");

        if (!$playerId) {
            return response()->json(["error" => "ID do jogador não fornecido."], 400);
        }

        $player = Player::find($playerId);

        if (!$player) {
            return response()->json(["error" => "Jogador não encontrado."], 404);
        }

        $scene = $player->currentScene;

        if (!$scene) {
            return response()->json(["error" => "Cena atual do jogador não encontrada."], 404);
        }

        // Carregar itens da cena
        $items = Item::where("scene_id", $scene->id)->get();

        return response()->json($items);
    }

    /**
     * Carrega o estado do jogo para um jogador existente.
     */
    public function loadGame(Request $request)
    {
        $playerId = $request->input("player_id");

        if (!$playerId) {
            return response()->json(["error" => "ID do jogador não fornecido."], 400);
        }

        $player = Player::with(["currentScene", "inventory.item"])->find($playerId);

        if (!$player) {
            return response()->json(["error" => "Jogador não encontrado."], 404);
        }

        // Retornar dados do jogador, cena atual e inventário
        return response()->json([
            "player" => $player,
            "current_scene" => $player->currentScene,
            "inventory" => $player->inventory,
            "scene_tiles" => $player->currentScene->tiles, // Adiciona os tiles da cena
            "scene_items" => Item::where("scene_id", $player->currentScene->id)->get(), // Adiciona os itens da cena
        ]);
    }

    /**
     * Interage com um item na cena.
     */
    public function interactWithItem(Request $request)
    {
        $itemId = $request->input("item_id");
        $actionType = $request->input("action_type"); // Ex: "pick", "examine", "move"
        $playerId = $request->input("player_id");

        $item = Item::find($itemId);
        $player = Player::find($playerId);

        if (!$item || !$player) {
            return response()->json(["error" => "Item ou jogador não encontrado."], 404);
        }

        switch ($actionType) {
            case "pick":
                if ($item->is_pickable) {
                    // Lógica para adicionar item ao inventário
                    // Exemplo simplificado: criar entrada no inventário
                    $player->inventory()->firstOrCreate(
                        ["item_id" => $item->id],
                        ["quantity" => 1]
                    )->increment("quantity");

                    // Remover item da cena (se for um item único)
                    $item->scene_id = null; // Ou deletar o item se não for mais necessário na cena
                    $item->save();

                    return response()->json(["message" => "Item pego: " . $item->name, "item" => $item]);
                } else {
                    return response()->json(["error" => "Este item não pode ser pego."], 400);
                }
                break;
            case "examine":
                return response()->json(["message" => "Você examina o item: " . $item->description, "item" => $item]);
                break;
            case "move":
                // Lógica para mover o item (se aplicável, ex: empurrar um barril)
                // Requer mais detalhes sobre como o movimento seria implementado (nova posição, validação)
                return response()->json(["message" => "Você tenta mover o item: " . $item->name]);
                break;
            default:
                return response()->json(["error" => "Ação desconhecida."], 400);
        }
    }

    /**
     * Atualiza os status do jogador (sanidade, fome, etc.).
     */
    public function updatePlayerStats(Request $request)
    {
        $playerId = $request->input("player_id");
        $player = Player::find($playerId);

        if (!$player) {
            return response()->json(["error" => "Jogador não encontrado."], 404);
        }

        // Exemplo de atualização de sanidade e fome
        $player->hunger = $request->input("hunger", $player->hunger);
        $player->thirst = $request->input("thirst", $player->thirst);
        $player->sanity = $request->input("sanity", $player->sanity);
        $player->fatigue = $request->input("fatigue", $player->fatigue);
        $player->status = $request->input("status", $player->status);

        $player->save();

        return response()->json(["message" => "Status do jogador atualizados.", "player" => $player]);
    }

    /**
     * Permite ao jogador mudar de cena.
     */
    public function changeScene(Request $request)
    {
        $playerId = $request->input("player_id");
        $newSceneId = $request->input("new_scene_id");

        $player = Player::find($playerId);
        $newScene = Scene::find($newSceneId);

        if (!$player || !$newScene) {
            return response()->json(["error" => "Jogador ou nova cena não encontrada."], 404);
        }

        $player->current_scene_id = $newSceneId;
        $player->save();

        return response()->json(["message" => "Cena alterada com sucesso.", "player" => $player, "new_scene" => $newScene]);
    }
}


