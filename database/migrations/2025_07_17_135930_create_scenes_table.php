<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scenes', function (Blueprint $table) {
            $table->id();
            $table->string('title'); 
            $table->text('description'); 
            $table->string('type')->nullable(); 
            $table->json('environment')->nullable(); 
            $table->string('background_image')->nullable(); 
            $table->string('audio_cue')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scenes');
    }
};