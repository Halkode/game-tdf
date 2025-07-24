<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Item;
use App\Models\Scene;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $scene = Scene::where("title", "Abrigo Isolado")->first();

        if (!$scene) {
            $this->command->info("Cena 'Abrigo Isolado' não encontrada. Execute o SceneSeeder primeiro.");
            return;
        }

        // Barris
        Item::firstOrCreate(
            [
                'name' => 'Barril Grande',
                'scene_id' => $scene->id,
                'position_x' => 3,
                'position_y' => 1,
            ],
            [
                'description' => 'Um barril de madeira grande e velho.',
                'weight' => 50,
                'icon' => 'images/assets-scenes/barrel.png',
                'type' => 'container',
                'is_pickable' => false,
                'is_important' => false,
            ]
        );

        Item::firstOrCreate(
            [
                'name' => 'Barril Pequeno',
                'scene_id' => $scene->id,
                'position_x' => 4,
                'position_y' => 2,
            ],
            [
                'description' => 'Um barril de madeira pequeno e velho.',
                'weight' => 30,
                'icon' => 'images/assets-scenes/barrel.png',
                'type' => 'container',
                'is_pickable' => false,
                'is_important' => false,
            ]
        );

        // Caixas
        Item::firstOrCreate(
            [
                'name' => 'Caixa de Madeira',
                'scene_id' => $scene->id,
                'position_x' => 1,
                'position_y' => 0,
            ],
            [
                'description' => 'Uma caixa de madeira empoeirada.',
                'weight' => 10,
                'icon' => 'images/assets-scenes/wooden_crate.png',
                'type' => 'container',
                'is_pickable' => false,
                'is_important' => false,
            ]
        );

        Item::firstOrCreate(
            [
                'name' => 'Caixa de Madeira Pequena',
                'scene_id' => $scene->id,
                'position_x' => 2,
                'position_y' => 4,
            ],
            [
                'description' => 'Uma pequena caixa de madeira.',
                'weight' => 5,
                'icon' => 'images/assets-scenes/wooden_crate.png',
                'type' => 'container',
                'is_pickable' => false,
                'is_important' => false,
            ]
        );

        // Tocha (montada na parede, não pegável inicialmente)
        Item::firstOrCreate(
            [
                'name' => 'Tocha de Parede',
                'scene_id' => $scene->id,
                'position_x' => -1,
                'position_y' => 2,
            ],
            [
                'description' => 'Uma tocha montada na parede, emitindo uma luz fraca.',
                'weight' => 2,
                'icon' => 'images/assets-scenes/torch.png',
                'type' => 'light_source',
                'is_pickable' => false,
                'is_important' => false,
            ]
        );

        // Chave (item importante e pegável)
        Item::firstOrCreate(
            [
                'name' => 'Chave Enferrujada',
                'scene_id' => $scene->id,
                'position_x' => 0,
                'position_y' => 4,
            ],
            [
                'description' => 'Uma chave antiga e enferrujada. Parece abrir algo importante.',
                'weight' => 0.1,
                'icon' => 'images/assets-scenes/key.png',
                'type' => 'key',
                'is_pickable' => true,
                'is_important' => true,
            ]
        );

        // Personagem (não é um item no sentido de ser pegável, mas pode ser um placeholder)
        // O player_character.png será usado para o sprite do jogador no frontend
    }
}


