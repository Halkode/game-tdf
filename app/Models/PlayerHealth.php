<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerHealth extends Model
{
    protected $fillable = [
        'player_id',
        'body_part',
        'condition',
        'bandaged',
        'pain',
        'sick'
    ];
    public function player()
    {
        return $this->belongsTo(Player::class);
    }
}
