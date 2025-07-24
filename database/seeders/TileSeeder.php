<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tile;
use App\Models\Scene;

class TileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Assumindo que já existe uma cena inicial ou que será criada
        $scene = Scene::firstOrCreate(["title" => "Abrigo Isolado"], ["description" => "Um abrigo escuro e empoeirado."]);

        // Criar tiles para um cômodo 5x5 como na imagem
        // As coordenadas (x, y) representam a posição na grade isométrica
        // O tipo 'floor' para o chão e 'wall' para as paredes

        // Chão
        for ($x = 0; $x < 5; $x++) {
            for ($y = 0; $y < 5; $y++) {
                Tile::create([
                    'scene_id' => $scene->id,
                    'x' => $x,
                    'y' => $y,
                    'type' => 'floor',
                ]);
            }
        }

        // Paredes (ajustar conforme a imagem fornecida)
        // Parede superior (y=0)
        for ($x = 0; $x < 5; $x++) {
            Tile::create([
                'scene_id' => $scene->id,
                'x' => $x,
                'y' => -1, // Posição da parede em relação ao chão
                'type' => 'wall',
            ]);
        }

        // Parede esquerda (x=0)
        for ($y = 0; $y < 5; $y++) {
            Tile::create([
                'scene_id' => $scene->id,
                'x' => -1, // Posição da parede em relação ao chão
                'y' => $y,
                'type' => 'wall',
            ]);
        }

        // Exemplo de porta na parede superior (x=2, y=-1)
        Tile::where('scene_id', $scene->id)
            ->where('x', 2)
            ->where('y', -1)
            ->update(['type' => 'door']);

        // Exemplo de tocha na parede esquerda (x=-1, y=2)
        Tile::where('scene_id', $scene->id)
            ->where('x', -1)
            ->where('y', 2)
            ->update(['type' => 'torch_mount']);

        // Adicionar objetos como barris e caixas como itens na cena
        // Estes serão adicionados no ItemSeeder, mas as posições aqui são para referência
    }
}


