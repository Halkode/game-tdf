<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tile extends Model
{
    protected $fillable = [
        'scene_id',
        'x',
        'y',
        'type',
    ];

    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }
}
