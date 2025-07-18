<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\SceneController;

Route::get('/scene-itens', [GameController::class, 'index'])->name('home');

Route::post('/scenes', [SceneController::class, 'storeComItens']);
Route::get('/scenes/{id}', [SceneController::class, 'show']);