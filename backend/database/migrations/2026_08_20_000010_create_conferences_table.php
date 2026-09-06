<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conferences', function (Blueprint $table) {
            $table->id();
            // RESTRICT, not cascade — an organiser's account can't be
            // deleted out from under their conferences.
            $table->foreignId('organiser_id')->constrained('users')->restrictOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            // JSON array of topic strings — simpler to work with via
            // Eloquent's array cast than a native Postgres text[] column.
            $table->json('topics')->nullable();
            // in_person | virtual | hybrid
            $table->enum('format', ['in_person', 'virtual', 'hybrid'])->default('in_person');
            // open | closed — whether the conference is accepting submissions
            $table->enum('submission_status', ['open', 'closed'])->default('open');
            $table->date('start_date');
            $table->date('end_date');
            $table->date('submission_deadline')->nullable();
            // Nullable as a set — a virtual conference has none of these.
            $table->string('venue_name')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('website_link')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conferences');
    }
};
