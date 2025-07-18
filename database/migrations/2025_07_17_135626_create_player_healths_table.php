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
        Schema::create('player_healths', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->string('body_part'); // 'cabeca', 'olho_esquerdo', etc
            $table->integer('health')->default(100); // Vida da parte (0 a 100)
            $table->boolean('bandaged')->default(false); // Está enfaixado?
            $table->boolean('pain')->default(false);     // Está com dor?
            $table->boolean('sick')->default(false);     // Está infeccionado?
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_healths');
    }
};
