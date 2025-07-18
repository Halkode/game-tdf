<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Action extends Model
{
    protected $fillable = [
        'scene_id',
        'text',
        'next_scene_id',
        'hunger_change',
        'thirst_change',
        'sanity_change',
        'fatigue_change',
        'health_change',
        'requirements',
    ];

    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }

    public function nextScene()
    {
        return $this->belongsTo(Scene::class, 'next_scene_id');
    }
}
 