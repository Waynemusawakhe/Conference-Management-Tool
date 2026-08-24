<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conference_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // enforce 1–5 via Laravel validation
            $table->text('content');
            $table->timestamps();

            $table->unique(['user_id', 'conference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
