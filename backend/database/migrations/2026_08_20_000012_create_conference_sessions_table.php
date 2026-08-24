<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conference_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conference_id')->constrained()->cascadeOnDelete();
            // Nullable + unique: a session may not have a submission
            // scheduled yet, but each submission can occupy at most one slot.
            $table->foreignId('submission_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('title')->nullable();
            $table->string('track')->nullable();
            $table->string('room')->nullable();
            $table->dateTime('scheduled_time');
            $table->timestamps();

            // Two sessions can't double-book the same room at the same time
            // within one conference.
            $table->unique(['conference_id', 'room', 'scheduled_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conference_sessions');
    }
};
