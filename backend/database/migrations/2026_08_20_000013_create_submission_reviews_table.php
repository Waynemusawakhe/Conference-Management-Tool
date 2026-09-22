<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submission_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('score')->nullable();
            $table->text('comments')->nullable();
            $table->enum('recommendation', ['accept', 'reject', 'revise'])->nullable();
            $table->boolean('locked')->default(false);
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['submission_id', 'reviewer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submission_reviews');
    }
};
