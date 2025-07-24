<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\SceneController;

// Rotas do GameController
Route::post("/game/new", [GameController::class, "novoJogo"]);
Route::get("/game/load", [GameController::class, "loadGame"]);
Route::get("/game/scene-items", [GameController::class, "getSceneItems"]);
Route::post("/game/interact", [GameController::class, "interactWithItem"]);
Route::post("/game/player-stats", [GameController::class, "updatePlayerStats"]);
Route::post("/game/change-scene", [GameController::class, "changeScene"]);

// Rotas do SceneController (manter as existentes)
Route::post("/scenes", [SceneController::class, "storeComItens"]);
Route::get("/scenes/{id}", [SceneController::class, "show"]);