<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Scene extends Model
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    protected $fillable = [
        'title',
        'description',
        'type',
        'environment',
        'background_image',
        'audio_cue',
    ];

    protected $casts = [
        'environment' => 'array',
    ];
    public function tiles()
    {
        return $this->hasMany(Tile::class);
    }
    public function actions()
    {
        return $this->hasMany(Action::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }
}
