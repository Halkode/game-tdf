<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    protected $fillable = [
        'current_scene_id',
        'hunger',
        'thirst',
        'sanity',
        'fatigue',
        'status',
        'clothing_json',
    ];

    // RELACIONAMENTOS
    public function currentScene()
    {
        return $this->belongsTo(Scene::class, 'current_scene_id');
    }

    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }

    public function health()
    {
        return $this->hasMany(PlayerHealth::class);
    }
}
