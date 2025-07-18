<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'name',
        'description',
        'weight',
        'icon',
        'type',
        'is_pickable',
        'is_important',
        'parent_id',
        'position_x',
        'position_y',
        'created_at',
        'updated_at'
    ];

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public static function getItens()
    {
        return self::all();
    }
    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }
}
