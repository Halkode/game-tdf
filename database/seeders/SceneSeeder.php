<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Scene;
use App\Models\Tile;
use App\Models\Item;

class SceneSeeder extends Seeder
{
    public function run(): void
    {
        $scene = Scene::create([
            'title' => 'Sala Inicial',
            'description' => 'Uma sala com uma mesa e chão de pedra.',
            'type' => 'interior',
            'environment' => [
                'iluminacao' => 'baixa',
                'clima' => 'seco'
            ],
            'background_image' => null,
            'audio_cue' => null
        ]);

        $width = 10;
        $height = 10;

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                Tile::create([
                    'scene_id' => $scene->id,
                    'x' => $x,
                    'y' => $y,
                    'type' => 'floor'
                ]);
            }
        }

        Item::create([
            'scene_id' => $scene->id,
            'name' => 'Mesa de Madeira',
            'description' => 'Uma mesa antiga e pesada.',
            'icon' => '/images/mesa-quadrada.png',
            'type' => 'cenario',
            'is_pickable' => false,
            'is_important' => true,
            'weight' => 0,
            'position_x' => 3,
            'position_y' => 2
        ]);

        Item::create([
            'scene_id' => $scene->id,
            'name' => 'Cadeira de Madeira',
            'description' => 'Uma cadeira de madeira frágil.',
            'icon' => '/images/cadeira.png',
            'type' => 'cenario',
            'is_pickable' => false,
            'is_important' => true,
            'weight' => 0,
            'position_x' => 2,
            'position_y' => 2
        ]);
    }
}
