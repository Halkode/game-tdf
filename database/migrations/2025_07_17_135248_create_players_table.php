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
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); 
            $table->integer('current_scene_id')->nullable();
            $table->integer('hunger')->default(100);    
            $table->integer('thirst')->default(100);    
            $table->integer('sanity')->default(100);   
            $table->integer('fatigue')->default(0);    
            $table->string('status')->nullable();    
            $table->json('clothing_json')->nullable();  
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
