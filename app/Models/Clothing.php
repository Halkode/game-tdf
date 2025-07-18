<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clothing extends Model
{
    protected $fillable = [
        'name',
        'slot',
        'warmth',
        'protection',
        'weight',
        'description'
    ];
}
