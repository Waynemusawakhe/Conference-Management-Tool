<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conference_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conference_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // registered | cancelled — cancelling flips this rather than
            // deleting the row, preserving history for reporting.
            $table->enum('status', ['registered', 'cancelled'])->default('registered');
            $table->timestamp('registered_at')->useCurrent();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->unique(['conference_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conference_registrations');
    }
};

