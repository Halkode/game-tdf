<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scene_id')->constrained()->onDelete('cascade');
            $table->string('text');
            $table->string('type')->nullable(); // Ex: 'pegar', 'usar', 'observar'
            $table->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete(); // Item relacionado à ação
            $table->integer('order')->default(0); // Para ordenar as ações na interface
            $table->foreignId('next_scene_id')->nullable()->constrained('scenes')->nullOnDelete();
            $table->integer('hunger_change')->default(0);
            $table->integer('thirst_change')->default(0);
            $table->integer('sanity_change')->default(0);
            $table->integer('fatigue_change')->default(0);
            $table->integer('health_change')->default(0);
            $table->json('requirements')->nullable(); 
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('actions');
    }
};