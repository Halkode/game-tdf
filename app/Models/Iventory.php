<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $fillable = [
        'player_id',
        'item_id',
        'quantity',
        'update_at'
    ];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
