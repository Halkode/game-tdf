<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class SaveController extends Controller
{
    public function saveGame(Request $request)
    {
        if (!Auth::check()) {
            return response()->json([
                'message' => 'Você precisa estar logado para salvar o jogo.'
            ], 401);
        }
    }
}