<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); // Usuário dono do player (pode ser nulo para jogadores anônimos)
            $table->integer('hunger')->default(100);    // Fome
            $table->integer('thirst')->default(100);    // Sede
            $table->integer('sanity')->default(100);    // Sanidade
            $table->integer('fatigue')->default(0);     // Fadiga
            $table->string('status')->nullable();       // Ex: 'vivo', 'morto', 'ferido'
            $table->json('clothing_json')->nullable();  // Equipamentos/roupas do jogador
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
